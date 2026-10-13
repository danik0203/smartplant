import React from 'react';
import { Sprout, Settings, Sun, Moon, Cloud, HardDrive, Home, ChevronDown } from 'lucide-react';
import { HouseholdMember, Household, GoogleUserProfile } from '../types';
import { GoogleAuthButton } from './GoogleAuthButton';

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
  currentHousehold: Household;
  onOpenHouseholdModal: () => void;
  googleUser: GoogleUserProfile | null;
  onGoogleUserChange: (user: GoogleUserProfile | null) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  members,
  currentMember,
  onSelectMember,
  isDark,
  onToggleDark,
  onOpenSettings,
  syncSource,
  currentHousehold,
  onOpenHouseholdModal,
  googleUser,
  onGoogleUserChange
}) => {
  const cycleMember = () => {
    if (members.length <= 1) return;
    const idx = members.findIndex((m) => m.id === currentMember.id);
    const next = members[(idx + 1) % members.length];
    onSelectMember(next);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F5]/85 dark:bg-void-950/85 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/5 pt-safe">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
        {/* Brand + Household Selector */}
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/25 shrink-0">
            <Sprout className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white tracking-tight hidden xs:inline">
            המשתלה
          </span>

          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              syncSource === 'remote' ? 'bg-emerald-500' : 'bg-amber-400'
            }`}
            title={syncSource === 'remote' ? 'מסונכרן בענן (Supabase)' : 'שמור מקומית בדפדפן'}
          />

          {/* Household / Group Pill */}
          <button
            onClick={onOpenHouseholdModal}
            title={`בית פעיל: ${currentHousehold.name}\nלחץ לניהול קוד שותפים, מעבר בין בתים או יצירת קבוצה`}
            className="h-8 px-2 sm:px-2.5 rounded-xl bg-white dark:bg-void-900 border border-slate-200/90 dark:border-white/10 text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1 hover:border-emerald-500/60 active:scale-95 transition shadow-sm max-w-[130px] sm:max-w-[160px]"
          >
            <Home className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{currentHousehold.name}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>
        </div>

        {/* Action Bar: Google Auth + Member + Theme + Settings */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Google Auth Button */}
          <GoogleAuthButton user={googleUser} onUserChange={onGoogleUserChange} />

          {/* 1-Tap Member Switcher */}
          <button
            onClick={cycleMember}
            title={`שותף פעיל: ${currentMember.name}\nלחץ להחלפה מהירה`}
            className="h-8 px-2 sm:px-2.5 rounded-xl bg-white dark:bg-void-900 border border-slate-200/90 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 active:scale-95 transition shadow-sm"
          >
            <span className="text-sm leading-none">{currentMember.avatar}</span>
            <span className="max-w-[50px] sm:max-w-[65px] truncate hidden sm:inline">
              {currentMember.name}
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleDark}
            aria-label="ערכת נושא"
            className="w-8 h-8 rounded-xl bg-white dark:bg-void-900 border border-slate-200/90 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            aria-label="הגדרות"
            className="w-8 h-8 rounded-xl bg-white dark:bg-void-900 border border-slate-200/90 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
