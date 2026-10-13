import React from 'react';
import { Droplets, Flower2, Stethoscope, History, Camera } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  onOpenAddPlant: () => void;
  thirstyCount: number;
  attentionCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenAddPlant,
  thirstyCount,
  attentionCount
}) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/90 dark:bg-void-900/90 backdrop-blur-xl border-t border-slate-200/60 dark:border-white/10 pb-safe">
      <div className="max-w-md mx-auto px-3 h-16 grid grid-cols-5 items-center">
        {/* Today */}
        <button
          onClick={() => onChangeTab('dashboard')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 rounded-2xl transition ${
            activeTab === 'dashboard'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="relative">
            <Droplets className="w-5 h-5" />
            {thirstyCount > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-sky-500 text-white text-[10px] font-black flex items-center justify-center">
                {thirstyCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">היום</span>
        </button>

        {/* Garden */}
        <button
          onClick={() => onChangeTab('plants')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 rounded-2xl transition ${
            activeTab === 'plants'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
          }`}
        >
          <Flower2 className="w-5 h-5" />
          <span className="text-[10px]">צמחים</span>
        </button>

        {/* Central Camera / Quick Add */}
        <div className="flex items-center justify-center">
          <button
            onClick={onOpenAddPlant}
            aria-label="הוסף צמח"
            className="-mt-5 w-13 h-13 p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/35 flex items-center justify-center transition transform active:scale-90 border-4 border-[#FAF8F5] dark:border-void-950"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>

        {/* AI Doctor */}
        <button
          onClick={() => onChangeTab('doctor')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 rounded-2xl transition ${
            activeTab === 'doctor'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="relative">
            <Stethoscope className="w-5 h-5" />
            {attentionCount > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">
                {attentionCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">רופא AI</span>
        </button>

        {/* Log */}
        <button
          onClick={() => onChangeTab('history')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 rounded-2xl transition ${
            activeTab === 'history'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px]">יומן</span>
        </button>
      </div>
    </nav>
  );
};
