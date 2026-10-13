import React from 'react';
import { Sprout, Settings, Sun, Moon, Cloud, HardDrive } from 'lucide-react';
import { HouseholdMember } from '../types';

interface NavbarProps {
  members: HouseholdMember[];
  currentMember: HouseholdMember;
  onSelectMember: (member: HouseholdMember) => void;
  isDark: boolean;
  onToggleDark: () => void;
  onOpenSettings: () => void;
  onOpenAddPlant: () => void;
  syncSource: 'remote' | 'local';
  thirstyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  members,
  currentMember,
  onSelectMember,
  isDark,
  onToggleDark,
  onOpenSettings,
  syncSource
}) => {
  const cycleMember = () => {
    if (members.length <= 1) return;
    const idx = members.findIndex((m) => m.id === currentMember.id);
    const next = members[(idx + 1) % members.length];
    onSelectMember(next);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F5]/85 dark:bg-void-950/85 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/5 pt-safe">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Minimal Brand + Sync Dot */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/25">
            <Sprout className="w-5 h-5" />
          </div>
          <span className="font-black text-base text-slate-900 dark:text-white tracking-tight">
            המשתלה
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              syncSource === 'remote' ? 'bg-emerald-500' : 'bg-amber-400'
            }`}
            title={syncSource === 'remote' ? 'מסונכרן בענן' : 'שמור מקומית'}
          />
        </div>

        {/* Minimal Icon Action Bar */}
        <div className="flex items-center gap-1.5">
          {/* 1-Tap Member Switcher */}
          <button
            onClick={cycleMember}
            title="החלף משתמש בלחיצה"
            className="h-9 px-3 rounded-2xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 active:scale-95 transition shadow-sm"
          >
            <span className="text-sm">{currentMember.avatar}</span>
            <span className="max-w-[65px] truncate">{currentMember.name}</span>
          </button>

          {/* Sync Icon Indicator */}
          <button
            onClick={onOpenSettings}
            title={syncSource === 'remote' ? 'מחובר לענן' : 'מצב מקומי'}
            className="w-9 h-9 rounded-2xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-emerald-600 transition"
          >
            {syncSource === 'remote' ? (
              <Cloud className="w-4 h-4 text-emerald-500" />
            ) : (
              <HardDrive className="w-4 h-4" />
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleDark}
            aria-label="ערכת נושא"
            className="w-9 h-9 rounded-2xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            aria-label="הגדרות"
            className="w-9 h-9 rounded-2xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
