import React, { useState } from 'react';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { GoogleUserProfile } from '../types';
import { plantSupabase } from '../services/supabase';

interface GoogleAuthButtonProps {
  user: GoogleUserProfile | null;
  onUserChange: (user: GoogleUserProfile | null) => void;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({ user, onUserChange }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await plantSupabase.signInWithGoogle();
      if (error) {
        alert(`שגיאת התחברות: ${error.message || error}`);
      }
    } catch (e: any) {
      alert(`שגיאה: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (window.confirm('האם להתנתק מחשבון Google?')) {
      await plantSupabase.signOut();
      onUserChange(null);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleSignOut}
          title={`מחובר: ${user.name} (${user.email})\nלחץ להתנתקות`}
          className="flex items-center gap-1.5 h-9 px-2.5 rounded-2xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-100 hover:border-rose-400 active:scale-95 transition shadow-sm"
        >
          {user.picture ? (
            <img src={user.picture} alt={user.name} className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
              {user.name.charAt(0)}
            </span>
          )}
          <span className="max-w-[70px] truncate hidden sm:inline">{user.name}</span>
          <LogOut className="w-3.5 h-3.5 text-slate-400 hover:text-rose-500" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      title="התחבר עם Google"
      className="h-9 px-3 rounded-2xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:border-emerald-500/50 active:scale-95 transition shadow-sm disabled:opacity-60"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
      ) : (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      )}
      <span className="hidden sm:inline">התחבר עם Google</span>
      <span className="sm:hidden">Google</span>
    </button>
  );
};
