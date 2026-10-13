import React, { useState } from 'react';
import {
  X,
  Users,
  Key,
  Cloud,
  Share2,
  Copy,
  Check,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { HouseholdMember, Plant, PlantCareLog } from '../types';
import { plantSupabase } from '../services/supabase';
import { getStoredGeminiKey, saveStoredGeminiKey } from '../services/geminiPlantAi';

interface SettingsModalProps {
  onClose: () => void;
  members: HouseholdMember[];
  onSaveMembers: (updated: HouseholdMember[]) => void;
  currentMember: HouseholdMember;
  onSelectCurrentMember: (m: HouseholdMember) => void;
  allPlants: Plant[];
  allLogs: PlantCareLog[];
  onImportBackup: (data: { plants: Plant[]; logs: PlantCareLog[]; members: HouseholdMember[] }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  members,
  onSaveMembers,
  currentMember,
  onSelectCurrentMember,
  allPlants,
  allLogs,
  onImportBackup
}) => {
  const [geminiKey, setGeminiKey] = useState(getStoredGeminiKey());
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAvatar, setNewMemberAvatar] = useState('🌿');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  const handleSaveGeminiKey = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredGeminiKey(geminiKey);
    alert('מפתח ה-Gemini נשמר בהצלחה!');
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    const newM: HouseholdMember = {
      id: `mem_${Date.now()}`,
      name: newMemberName.trim(),
      avatar: newMemberAvatar,
      color: '#16a34a'
    };
    onSaveMembers([...members, newM]);
    setNewMemberName('');
  };

  const handleRemoveMember = (id: string) => {
    if (members.length <= 1) {
      alert('חייב להישאר לפחות דייר אחד בבית.');
      return;
    }
    const filtered = members.filter((m) => m.id !== id);
    onSaveMembers(filtered);
    if (currentMember.id === id) {
      onSelectCurrentMember(filtered[0]);
    }
  };

  const handleCopyInviteLink = () => {
    const link = plantSupabase.getInviteLink();
    navigator.clipboard.writeText(link);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleShareInviteWhatsApp = () => {
    const link = plantSupabase.getInviteLink();
    const text = `היי! 🌿 מוזמן/ת להצטרף לניהול צמחי הבית שלנו במשתלה הביתית:\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleTestSupabase = async () => {
    setIsTesting(true);
    const res = await plantSupabase.testConnection();
    setIsTesting(false);
    setTestResult(res.message);
  };

  const handleExportBackup = () => {
    const data = {
      version: 'plants_v1',
      exportedAt: new Date().toISOString(),
      plants: allPlants,
      logs: allLogs,
      members
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plants_garden_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.plants && Array.isArray(json.plants)) {
          onImportBackup({
            plants: json.plants,
            logs: json.logs || [],
            members: json.members || members
          });
          alert('הגיבוי נטען בהצלחה לגינה הביתית!');
          onClose();
        } else {
          alert('קובץ גיבוי לא תקין.');
        }
      } catch {
        alert('שגיאה בקריאת קובץ ה-JSON.');
      }
    };
    reader.readAsText(file);
  };

  const SQL_SNIPPET = `-- טבלאות המשתלה הביתית ב-Supabase:
create table if not exists public.plants (
  id text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null, nickname text default '', species text default '',
  room text not null default 'living_room', image_url text default '',
  watering_frequency_days integer not null default 7, water_amount_ml integer not null default 250,
  watering_tips text default '', last_watered_at text not null, last_watered_by text default 'אני',
  snoozed_until text default '', fertilize_frequency_days integer default 30, last_fertilized_at text default '',
  mist_frequency_days integer default 0, last_misted_at text default '', soil_type text not null default 'all_purpose',
  soil_description text default '', has_drainage_hole boolean default true, sunlight text not null default 'bright_indirect',
  humidity text not null default 'medium', temperature_range text default '18°C - 28°C', is_pet_safe boolean default true,
  health_status text not null default 'healthy', health_score integer not null default 90,
  current_issues jsonb not null default '[]'::jsonb, care_recommendations jsonb not null default '[]'::jsonb,
  diagnosis_history jsonb not null default '[]'::jsonb, notes text default ''
);
create table if not exists public.plant_care_logs (
  id text primary key, created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  plant_id text not null, plant_name text not null, action text not null, performed_by text not null, notes text default ''
);
create table if not exists public.plant_members (
  id text primary key, created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null, avatar text default '🌿', color text default '#16a34a', phone text default '', google_email text default '', picture text default ''
);
alter publication supabase_realtime add table public.plants;
alter publication supabase_realtime add table public.plant_care_logs;
alter publication supabase_realtime add table public.plant_members;
alter table public.plants enable row level security;
alter table public.plant_care_logs enable row level security;
alter table public.plant_members enable row level security;
create policy "allow all plants" on public.plants for all using (true) with check (true);
create policy "allow all logs" on public.plant_care_logs for all using (true) with check (true);
create policy "allow all members" on public.plant_members for all using (true) with check (true);`;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] dark:bg-void-950 w-full max-w-xl sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200/80 dark:border-white/10 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#FAF8F5]/95 dark:bg-void-950/95 backdrop-blur-md px-5 py-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">הגדרות וסנכרון ⚙️</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ניהול בני הבית, סנכרון בין מכשירים, מפתח Gemini AI וגיבוי
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-void-800 text-slate-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Section 1: Household Members */}
          <div className="rounded-2xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 p-4 space-y-3 shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>דיירי הבית ושותפים ({members.length})</span>
            </h3>

            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                    currentMember.id === m.id
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                      : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-void-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{m.avatar}</span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{m.name}</span>
                    {currentMember.id === m.id && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                        דייר נוכחי במכשיר זה
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {currentMember.id !== m.id && (
                      <button
                        onClick={() => onSelectCurrentMember(m)}
                        className="text-xs text-emerald-600 hover:underline font-bold"
                      >
                        בחר כפעיל
                      </button>
                    )}
                    {members.length > 1 && (
                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add member form */}
            <form onSubmit={handleAddMember} className="flex items-center gap-2 pt-1">
              <select
                value={newMemberAvatar}
                onChange={(e) => setNewMemberAvatar(e.target.value)}
                className="px-2 py-2 rounded-xl bg-slate-50 dark:bg-void-800 border border-slate-200 dark:border-white/10 text-base"
              >
                <option value="🌿">🌿</option>
                <option value="💧">💧</option>
                <option value="🪴">🪴</option>
                <option value="🌸">🌸</option>
                <option value="🌵">🌵</option>
                <option value="🌱">🌱</option>
              </select>
              <input
                type="text"
                required
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="שם שותף / בן בית נוסף..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-void-800 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>הוסף</span>
              </button>
            </form>
          </div>

          {/* Section 2: Multi-Device Sync & Invite Link */}
          <div className="rounded-2xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 p-4 space-y-3 shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Cloud className="w-4 h-4 text-sky-500" />
              <span>סנכרון ענן בין מכשירים וקישור הצטרפות</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              שלח לשותפים או לבני הבית קישור ישיר לוואטסאפ. פתיחת הקישור בכל טלפון או מחשב תחבר אותם מיד לאותה הגינה הביתית!
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleShareInviteWhatsApp}
                className="flex-1 min-w-[160px] py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Share2 className="w-4 h-4" />
                <span>שלח קישור הצטרפות בוואטסאפ</span>
              </button>
              <button
                onClick={handleCopyInviteLink}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-void-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
              >
                {copiedInvite ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedInvite ? 'הועתק!' : 'העתק קישור'}</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleTestSupabase}
                  disabled={isTesting}
                  className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>בדוק סטטוס חיבור Supabase</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(SQL_SNIPPET);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 2000);
                  }}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedSql ? 'קוד ה-SQL הועתק!' : 'העתק סכמת SQL ל-Supabase'}</span>
                </button>
              </div>

              {testResult && (
                <p className="text-xs bg-slate-50 dark:bg-void-800 p-2.5 rounded-xl font-semibold text-slate-700 dark:text-slate-300">
                  {testResult}
                </p>
              )}
            </div>
          </div>

          {/* Section 3: Gemini AI Vision API Key */}
          <div className="rounded-2xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 p-4 space-y-3 shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              <span>מפתח Google Gemini AI (מוגדר ועובד אוטומטית)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              משמש לזיהוי אוטומטי של צמחים בצילום ולאבחון רופא הצמחים. המפתח מוגדר מראש ואינו דורש שינוי.
            </p>

            <form onSubmit={handleSaveGeminiKey} className="space-y-2">
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-void-800 border border-slate-200 dark:border-white/10 text-xs font-mono"
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-600 font-bold">✓ מפתח פעיל וזמין</span>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 dark:bg-emerald-700 text-white font-bold"
                >
                  עדכן מפתח
                </button>
              </div>
            </form>
          </div>

          {/* Section 4: Backup & Restore */}
          <div className="rounded-2xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 p-4 space-y-3 shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-slate-600" />
              <span>גיבוי ושחזור נתונים</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportBackup}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-void-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ייצא גיבוי JSON</span>
              </button>

              <label className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-void-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" />
                <span>ייבא גיבוי JSON</span>
                <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
