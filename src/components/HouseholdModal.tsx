import React, { useState } from 'react';
import {
  X,
  Home,
  Users,
  Copy,
  Check,
  Share2,
  Plus,
  Key,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { Household, HouseholdMember, GoogleUserProfile } from '../types';
import { plantSupabase } from '../services/supabase';

interface HouseholdModalProps {
  onClose: () => void;
  currentHousehold: Household;
  allHouseholds: Household[];
  members: HouseholdMember[];
  googleUser: GoogleUserProfile | null;
  onSwitchHousehold: (household: Household) => void;
  onHouseholdCreatedOrJoined: (newHousehold: Household) => void;
}

export const HouseholdModal: React.FC<HouseholdModalProps> = ({
  onClose,
  currentHousehold,
  allHouseholds,
  members,
  googleUser,
  onSwitchHousehold,
  onHouseholdCreatedOrJoined
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'create' | 'join'>('info');
  const [newHomeName, setNewHomeName] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentHousehold.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const link = plantSupabase.getHouseholdInviteLink(currentHousehold.inviteCode);
    const text = `היי! 🌿 מוזמן להצטרף לבית שלנו "${currentHousehold.name}" באפליקציית SmartPlant:\nקוד הצטרפות: *${currentHousehold.inviteCode}*\nאו היכנס ישירות:\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHomeName.trim()) return;

    setIsLoading(true);
    setErrorMsg('');
    try {
      const created = await plantSupabase.createHousehold(
        newHomeName,
        googleUser?.name || 'שותף',
        googleUser
      );
      onHouseholdCreatedOrJoined(created);
      setActiveTab('info');
      setNewHomeName('');
    } catch (e: any) {
      setErrorMsg(e.message || 'שגיאה ביצירת הבית');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await plantSupabase.joinHouseholdByCode(
        joinCodeInput,
        googleUser?.name || 'שותף',
        googleUser
      );
      if (res.success && res.household) {
        onHouseholdCreatedOrJoined(res.household);
        setActiveTab('info');
        setJoinCodeInput('');
      } else {
        setErrorMsg(res.message || 'קוד הצטרפות שגוי');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'שגיאה בהצטרפות');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#FAF8F5] dark:bg-void-950 w-full max-w-md sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80 dark:border-white/10 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-200/70 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              קבוצות ובתים משותפים 🏡
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 dark:bg-void-800 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 pb-0">
          <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-200/70 dark:bg-void-900 text-xs font-bold">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-2 rounded-xl transition ${
                activeTab === 'info'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              הבית הנוכחי
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`py-2 rounded-xl transition ${
                activeTab === 'join'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              הצטרף עם קוד 🔑
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2 rounded-xl transition ${
                activeTab === 'create'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              צור בית ➕
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* TAB 1: Current Household Info & Members */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* Household Badge Card */}
              <div className="rounded-3xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">בית פעיל:</span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {currentHousehold.name}
                    </h3>
                  </div>

                  {/* Invite Code Pill */}
                  <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/20 px-3 py-1.5 rounded-2xl">
                    <span className="font-mono font-black text-xs text-emerald-800 dark:text-emerald-200">
                      {currentHousehold.inviteCode}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      title="העתק קוד"
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* 1-Tap WhatsApp Invite Button */}
                <button
                  onClick={handleShareWhatsApp}
                  className="w-full py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98"
                >
                  <Share2 className="w-4 h-4" />
                  <span>הזמן שותף בוואטסאפ עם קוד וקישור</span>
                </button>
              </div>

              {/* Members in This Household */}
              <div className="rounded-3xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 p-4 space-y-2.5 shadow-sm">
                <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>שותפים בבית זה ({members.length})</span>
                </span>

                <div className="space-y-1.5">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-2xl bg-slate-50 dark:bg-void-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        {m.picture ? (
                          <img
                            src={m.picture}
                            alt={m.name}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-base">{m.avatar}</span>
                        )}
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">
                            {m.name}
                          </span>
                          {m.email && (
                            <span className="text-[10px] text-slate-400 block">{m.email}</span>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200">
                        {m.role === 'admin' ? 'מנהל' : 'שותף'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Switch Household (if user is in multiple) */}
              {allHouseholds.length > 1 && (
                <div className="rounded-3xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 p-4 space-y-2">
                  <span className="text-xs font-bold text-slate-400 block">עבור לבית אחר:</span>
                  <div className="space-y-1">
                    {allHouseholds.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => {
                          onSwitchHousehold(h);
                          onClose();
                        }}
                        className={`w-full p-2.5 rounded-2xl text-xs font-bold flex items-center justify-between transition ${
                          currentHousehold.id === h.id
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30'
                            : 'hover:bg-slate-100 dark:hover:bg-void-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>🏡 {h.name}</span>
                        {currentHousehold.id === h.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Join Existing Household by Code */}
          {activeTab === 'join' && (
            <form onSubmit={handleJoinHousehold} className="space-y-3">
              <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 text-xs text-sky-900 dark:text-sky-200 leading-relaxed">
                השותף שלך שלח לך קוד? הדבק אותו כאן כדי להתחבר מיד לאותו הבית ולראות את כל הצמחים!
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  קוד הצטרפות (למשל: PLANT-777):
                </label>
                <input
                  type="text"
                  required
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="PLANT-XXXX"
                  className="w-full px-3 py-2.5 rounded-2xl bg-white dark:bg-void-900 border border-slate-200 dark:border-white/10 text-sm font-mono font-bold tracking-wider uppercase text-center focus:outline-none focus:border-emerald-500"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-600 font-bold text-center">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition disabled:opacity-60"
              >
                {isLoading ? 'מתחבר...' : 'הצטרף לבית 🌿'}
              </button>
            </form>
          )}

          {/* TAB 3: Create New Household */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateHousehold} className="space-y-3">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                צור קבוצה חדשה עבור הדירה, המרפסת או המשרד שלך. לאחר היצירה יווצר קוד שתוכל לשלוח לשותפים.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  שם הבית / הקבוצה:
                </label>
                <input
                  type="text"
                  required
                  value={newHomeName}
                  onChange={(e) => setNewHomeName(e.target.value)}
                  placeholder="למשל: דירת שותפים דיזנגוף 🏡"
                  className="w-full px-3 py-2.5 rounded-2xl bg-white dark:bg-void-900 border border-slate-200 dark:border-white/10 text-sm font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-600 font-bold text-center">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition disabled:opacity-60"
              >
                {isLoading ? 'יוצר בית...' : 'צור בית והפק קוד שותפים 🎉'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
