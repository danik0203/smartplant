import React, { useState } from 'react';
import { Sprout, Users, Droplets, Bot, ShieldCheck, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { plantSupabase, STORAGE_KEYS } from '../services/supabase';
import { GoogleUserProfile } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: GoogleUserProfile) => void;
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      if (credentialResponse.credential) {
        const payload = parseJwt(credentialResponse.credential);
        if (payload) {
          const profile: GoogleUserProfile = {
            email: payload.email || '',
            name: payload.name || payload.given_name || 'שותף',
            picture: payload.picture || '',
            sub: payload.sub || `usr_${Date.now()}`
          };

          // Save locally
          localStorage.setItem(STORAGE_KEYS.GOOGLE_USER, JSON.stringify(profile));

          // Sync to Supabase in the background
          try {
            await plantSupabase.signInWithGoogleCredential(credentialResponse.credential);
          } catch {}

          onLoginSuccess(profile);
          return;
        }
      }
      setErrorMessage('לא התקבלו נתוני משתמש מ-Google');
    } catch (e: any) {
      setErrorMessage(e.message || 'שגיאה באימות חשבון Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthFallback = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const { error } = await plantSupabase.signInWithGoogle();
      if (error) {
        setErrorMessage(error.message || 'שגיאה בהתחברות לגוגל');
        setIsLoading(false);
      }
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

        {/* Google Sign In Component */}
        <div className="w-full space-y-3 pt-2">
          {isLoading ? (
            <div className="w-full py-4 rounded-2xl bg-white dark:bg-void-900 border border-slate-200 dark:border-white/10 flex items-center justify-center gap-2 shadow-sm">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">מתחבר ומאמת חשבון...</span>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-2">
              <div className="w-full flex justify-center overflow-hidden rounded-2xl">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setErrorMessage('ההתחברות ל-Google בוטלה או נכשלה')}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="pill"
                  width="320"
                />
              </div>

              {/* Fallback button if Google script is blocked */}
              <button
                onClick={handleOAuthFallback}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold underline"
              >
                בעיה בכפתור? לחץ להתחברות חלופית
              </button>
            </div>
          )}

          {errorMessage && (
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
              {errorMessage}
            </p>
          )}

          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1 pt-1">
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
