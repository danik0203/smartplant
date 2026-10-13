import React from 'react';
import { Sprout, Settings, Home, ChevronDown } from 'lucide-react';
import { Household, GoogleUserProfile } from '../types';

interface NavbarProps {
  syncSource: 'remote' | 'local';
  currentHousehold: Household;
  onOpenHouseholdModal: () => void;
  onOpenSettings: () => void;
  googleUser: GoogleUserProfile | null;
  members?: any[];
  currentMember?: any;
  onSelectMember?: (m: any) => void;
  isDark?: boolean;
  onToggleDark?: () => void;
  onOpenAddPlant?: () => void;
  onOpenAIChat?: () => void;
  thirstyCount?: number;
  onGoogleUserChange?: (u: any) => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  syncSource,
  currentHousehold,
  onOpenHouseholdModal,
  onOpenSettings,
  googleUser
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F5]/90 dark:bg-void-950/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 pt-safe">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Right side (RTL): Brand + Active Household Pill */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/30 shrink-0">
            <Sprout className="w-4 h-4" />
          </div>

          <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight shrink-0">
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
            title={`בית פעיל: ${currentHousehold.name}\nלחץ לניהול קוד שותפים או מעבר בין בתים`}
            className="h-8 px-2.5 rounded-xl bg-white dark:bg-void-900 border border-slate-200/90 dark:border-white/10 text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 hover:border-emerald-500/60 active:scale-95 transition shadow-sm max-w-[150px] sm:max-w-[200px]"
          >
            <Home className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{currentHousehold.name}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>
        </div>

        {/* Left side (RTL): Single Minimalist Settings Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenSettings}
            aria-label="הגדרות וניהול"
            title="הגדרות, מראה, חשבון ויציאה"
            className="h-9 px-3 rounded-xl bg-white dark:bg-void-900 border border-slate-200/90 dark:border-white/10 flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 active:scale-95 transition shadow-sm"
          >
            {googleUser?.picture ? (
              <img
                src={googleUser.picture}
                alt={googleUser.name}
                className="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-emerald-500/50"
              />
            ) : (
              <Settings className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
            )}
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 hidden sm:inline">
              הגדרות
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
