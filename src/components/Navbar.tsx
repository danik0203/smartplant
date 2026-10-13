import React from 'react';
import { Sprout, Settings, Sun, Moon, Home, ChevronDown, LogOut } from 'lucide-react';
import { HouseholdMember, Household, GoogleUserProfile } from '../types';

interface NavbarProps {
  members: HouseholdMember[];
  currentMember: HouseholdMember;
  onSelectMember: (member: HouseholdMember) => void;
  isDark: boolean;
  onToggleDark: () => void;
  onOpenSettings: () => void;
  onOpenAddPlant: () => void;
  onOpenAIChat: () => void;
  syncSource: 'remote' | 'local';
  thirstyCount: number;
  currentHousehold: Household;
  onOpenHouseholdModal: () => void;
  googleUser: GoogleUserProfile | null;
  onGoogleUserChange: (user: GoogleUserProfile | null) => void;
  onLogout?: () => void;
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
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F5]/90 dark:bg-void-950/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 pt-safe">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
        {/* Brand + Household Selector */}
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
            className="h-8 px-2.5 rounded-xl bg-white dark:bg-void-900 border border-slate-200/90 dark:border-white/10 text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 hover:border-emerald-500/60 active:scale-95 transition shadow-sm max-w-[140px] sm:max-w-[180px]"
          >
            <Home className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{currentHousehold.name}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>
        </div>

        {/* Action Bar: Google User Profile + Theme + Settings */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Authenticated Google User Pill with Logout */}
          {googleUser && (
            <div className="flex items-center gap-1.5 h-8 px-2 rounded-xl bg-white dark:bg-void-900 border border-slate-200/90 dark:border-white/10 shadow-sm">
              {googleUser.picture ? (
                <img
                  src={googleUser.picture}
                  alt={googleUser.name}
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                />
              ) : (
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                  {googleUser.name.charAt(0)}
                </span>
              )}

              <span className="text-xs font-black text-slate-900 dark:text-white max-w-[75px] truncate hidden sm:inline">
                {googleUser.name}
              </span>

              {onLogout && (
                <button
                  onClick={onLogout}
                  title="התנתק מחשבון Google ונעל את האפליקציה"
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 active:scale-90 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={onToggleDark}
            aria-label="ערכת נושא"
            className="w-8 h-8 rounded-xl bg-white dark:bg-void-900 border border-slate-200/90 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 active:scale-95 transition hover:border-slate-300"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            aria-label="הגדרות"
            className="w-8 h-8 rounded-xl bg-white dark:bg-void-900 border border-slate-200/90 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 active:scale-95 transition hover:border-slate-300"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
