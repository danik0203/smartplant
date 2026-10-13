import React, { useState } from 'react';
import { Sprout, Users, Droplets, Bot, ShieldCheck, Loader2 } from 'lucide-react';
import { plantSupabase } from '../services/supabase';
import { GoogleUserProfile } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: GoogleUserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const { error } = await plantSupabase.signInWithGoogle();
      if (error) {
        setErrorMessage(error.message || 'שגיאה בהתחברות לגוגל');
        setIsLoading(false);
      }
      // If OAuth redirect triggers, browser navigates to Google.
    } catch (e: any) {
      setErrorMessage(e.message || 'שגיאה בלתי צפויה');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-void-950 flex flex-col justify-between items-center p-6 text-slate-900 dark:text-slate-100 select-none">
      {/* Top spacing */}
      <div className="w-full max-w-sm pt-8" />

      {/* Main Card */}
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
        {/* Brand Icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-600/30">
            <Sprout className="w-10 h-10" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-sky-500 border-2 border-[#FAF8F5] dark:border-void-950 text-white flex items-center justify-center shadow">
            <Droplets className="w-3.5 h-3.5 fill-white" />
          </span>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            המשתלה הביתית
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            ניהול השקיה, סנכרון שותפים ורופא צמחים AI 🌿
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="w-full space-y-2.5 text-right">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">השקיה חכמה בלחיצה</h4>
              <p className="text-[11px] text-slate-400">תזכורות לפי עונות השנה וסוג האדמה</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">סנכרון בין כל השותפים</h4>
              <p className="text-[11px] text-slate-400">קוד בית פשוט לשיתוף עם כולם בדירה</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">רופא וצ'אט AI בוטנאי</h4>
              <p className="text-[11px] text-slate-400">אבחון תמונות של עלים ומענה קולי בעברית</p>
            </div>
          </div>
        </div>

        {/* Google Sign In Button */}
        <div className="w-full space-y-3 pt-2">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 dark:bg-void-900 dark:hover:bg-void-850 border border-slate-300 dark:border-white/20 text-slate-800 dark:text-slate-100 font-extrabold text-sm flex items-center justify-center gap-3 shadow-md hover:shadow-lg active:scale-98 transition disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
            <span>{isLoading ? 'מתחבר ל-Google...' : 'התחברות מאובטחת עם Google'}</span>
          </button>

          {errorMessage && (
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
              {errorMessage}
            </p>
          )}

          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>המידע והצמחים שלך נשמרים בענן מאובטח</span>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-sm text-center text-[11px] text-slate-400 pb-2">
        <span>SmartPlant • המשתלה הביתית לניהול צמחים</span>
      </div>
    </div>
  );
};
