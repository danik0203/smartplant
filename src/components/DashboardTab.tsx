import React from 'react';
import {
  Droplets,
  Clock,
  CheckCircle2,
  Share2,
  SprayCan,
  Sprout,
  Camera,
  HeartPulse,
  Sun,
  Stethoscope
} from 'lucide-react';
import { Plant, HouseholdMember } from '../types';
import {
  getPlantWateringStatus,
  buildWhatsAppWateringReminder
} from '../utils/plantCalculations';
import { ROOM_LABELS, SUNLIGHT_LABELS } from '../services/mockPlants';

interface DashboardTabProps {
  plants: Plant[];
  currentMember: HouseholdMember;
  onWaterPlant: (plant: Plant) => void;
  onSnoozePlant: (plant: Plant, days?: number) => void;
  onMistPlant: (plant: Plant) => void;
  onFertilizePlant: (plant: Plant) => void;
  onSelectPlant: (plant: Plant) => void;
  onOpenAddPlant: () => void;
  onOpenDoctorForPlant: (plant: Plant) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  plants,
  currentMember,
  onWaterPlant,
  onSnoozePlant,
  onMistPlant,
  onFertilizePlant,
  onSelectPlant,
  onOpenAddPlant,
  onOpenDoctorForPlant
}) => {
  const enriched = plants.map((plant) => ({
    plant,
    status: getPlantWateringStatus(plant)
  }));

  const thirstyNow = enriched.filter(
    (item) => item.status.urgency === 'overdue' || item.status.urgency === 'due_today'
  );
  const upcomingAndOk = enriched.filter(
    (item) =>
      item.status.urgency === 'upcoming' ||
      item.status.urgency === 'snoozed' ||
      item.status.urgency === 'ok'
  );

  const extraCareTasks = enriched.filter(
    (item) => item.status.isMistingDue || item.status.isFertilizingDue
  );

  const avgHealthScore =
    plants.length > 0
      ? Math.round(plants.reduce((acc, p) => acc + (p.healthScore || 90), 0) / plants.length)
      : 100;

  const handleShareWhatsApp = () => {
    const text = buildWhatsAppWateringReminder(
      thirstyNow.map((x) => x.plant),
      currentMember.name
    );
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Minimalist KPI & Quick-Action Strip */}
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-2xl bg-white dark:bg-void-900 border border-slate-200/70 dark:border-white/10 p-3 flex flex-col items-center justify-center shadow-sm">
          <div className="flex items-center gap-1 text-sky-500 font-black text-lg">
            <Droplets className="w-4 h-4 fill-sky-500/20" />
            <span>{thirstyNow.length}</span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">להשקיה</span>
        </div>

        <div className="rounded-2xl bg-white dark:bg-void-900 border border-slate-200/70 dark:border-white/10 p-3 flex flex-col items-center justify-center shadow-sm">
          <div className="flex items-center gap-1 text-emerald-500 font-black text-lg">
            <HeartPulse className="w-4 h-4" />
            <span>{avgHealthScore}%</span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">בריאות</span>
        </div>

        <button
          onClick={handleShareWhatsApp}
          title="שלח תזכורת בוואטסאפ"
          className="rounded-2xl bg-white dark:bg-void-900 border border-slate-200/70 dark:border-white/10 p-3 flex flex-col items-center justify-center shadow-sm hover:border-emerald-500/40 active:scale-95 transition"
        >
          <Share2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-0.5" />
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">וואטסאפ</span>
        </button>

        <button
          onClick={onOpenAddPlant}
          title="סרוק צמח חדש ב-AI"
          className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white p-3 flex flex-col items-center justify-center shadow-sm shadow-emerald-600/20 active:scale-95 transition"
        >
          <Camera className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">סרוק AI</span>
        </button>
      </div>

      {/* Section 1: 1-Tap Thirsty Plants */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-sky-500" />
            <span>צמאים היום ({thirstyNow.length})</span>
          </span>
        </div>

        {thirstyNow.length === 0 ? (
          <div className="rounded-3xl bg-white dark:bg-void-900 border border-emerald-500/20 py-7 px-4 flex flex-col items-center justify-center text-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <span className="font-bold text-sm text-slate-800 dark:text-white">הכל מושקה ורווי ✨</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {thirstyNow.map(({ plant, status }) => {
              const roomMeta = ROOM_LABELS[plant.room] || ROOM_LABELS.living_room;
              const sunMeta = SUNLIGHT_LABELS[plant.sunlight] || SUNLIGHT_LABELS.bright_indirect;

              return (
                <div
                  key={plant.id}
                  onClick={() => onSelectPlant(plant)}
                  className="rounded-3xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 p-3 flex items-center justify-between gap-3 shadow-sm hover:border-sky-500/40 transition cursor-pointer"
                >
                  {/* Right: Image with room badge + concise info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={plant.imageUrl}
                        alt={plant.name}
                        className="w-16 h-16 rounded-2xl object-cover"
                      />
                      <span
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-black/65 backdrop-blur-md text-xs flex items-center justify-center shadow"
                        title={roomMeta.label}
                      >
                        {roomMeta.icon}
                      </span>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                          {plant.name}
                        </h4>
                        {status.urgency === 'overdue' && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="באיחור" />
                        )}
                      </div>

                      {/* Icon-Only Specs Pills */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        <span className="inline-flex items-center gap-0.5 text-sky-600 dark:text-sky-400 font-bold">
                          <Droplets className="w-3.5 h-3.5" />
                          {plant.waterAmountMl}ml
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-0.5" title={sunMeta.label}>
                          <span>{sunMeta.icon}</span>
                        </span>
                        <span>•</span>
                        <span
                          className={
                            status.urgency === 'overdue'
                              ? 'text-rose-600 dark:text-rose-400 font-bold'
                              : 'text-slate-500'
                          }
                        >
                          {status.urgency === 'overdue'
                            ? `איחור ${Math.abs(status.daysUntilNext)} ימ׳`
                            : 'היום'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Left: 1-Tap Action Buttons (No text clutter) */}
                  <div
                    className="flex items-center gap-1.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Snooze 2 days */}
                    <button
                      onClick={() => onSnoozePlant(plant, 2)}
                      title="האדמה לחה - דחה ביומיים"
                      className="w-10 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-void-800 dark:hover:bg-void-700 text-slate-600 dark:text-slate-300 flex flex-col items-center justify-center active:scale-90 transition"
                    >
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="text-[9px] font-bold">+2ד׳</span>
                    </button>

                    {/* 1-Tap Water Now */}
                    <button
                      onClick={() => onWaterPlant(plant)}
                      title="סמן שהושקה עכשיו"
                      className="h-11 px-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/25 active:scale-90 transition"
                    >
                      <Droplets className="w-4 h-4 fill-white/30" />
                      <span>השקה</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 2: Compact 1-Tap Mist & Fertilize Strip */}
      {extraCareTasks.length > 0 && (
        <section className="space-y-2">
          <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 px-1 flex items-center gap-1.5">
            <SprayCan className="w-3.5 h-3.5 text-teal-500" />
            <span>לחות ודישון ({extraCareTasks.length})</span>
          </span>

          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
            {extraCareTasks.map(({ plant, status }) => (
              <div
                key={`extra_${plant.id}`}
                className="rounded-2xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 p-2.5 flex items-center gap-2.5 shrink-0 shadow-sm"
              >
                <img
                  src={plant.imageUrl}
                  alt={plant.name}
                  onClick={() => onSelectPlant(plant)}
                  className="w-10 h-10 rounded-xl object-cover cursor-pointer"
                />
                <span
                  onClick={() => onSelectPlant(plant)}
                  className="font-bold text-xs text-slate-800 dark:text-white max-w-[90px] truncate cursor-pointer"
                >
                  {plant.name}
                </span>

                {status.isMistingDue && (
                  <button
                    onClick={() => onMistPlant(plant)}
                    title="רסס לחות"
                    className="w-9 h-9 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-300 flex items-center justify-center active:scale-90 transition"
                  >
                    <SprayCan className="w-4 h-4" />
                  </button>
                )}

                {status.isFertilizingDue && (
                  <button
                    onClick={() => onFertilizePlant(plant)}
                    title="דשן קרקע"
                    className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center active:scale-90 transition"
                  >
                    <Sprout className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 3: Compact Visual Grid of Satisfied Plants */}
      {upcomingAndOk.length > 0 && (
        <section className="space-y-2.5">
          <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 px-1 flex items-center gap-1.5">
            <Sprout className="w-3.5 h-3.5 text-emerald-500" />
            <span>רוויים ובמעקב ({upcomingAndOk.length})</span>
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            {upcomingAndOk.map(({ plant, status }) => {
              const roomMeta = ROOM_LABELS[plant.room] || ROOM_LABELS.living_room;
              return (
                <div
                  key={plant.id}
                  onClick={() => onSelectPlant(plant)}
                  className="rounded-3xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 p-3 flex items-center gap-2.5 cursor-pointer hover:border-emerald-500/40 transition shadow-sm"
                >
                  <div className="relative shrink-0">
                    <img
                      src={plant.imageUrl}
                      alt={plant.name}
                      className="w-12 h-12 rounded-2xl object-cover"
                    />
                    <span className="absolute -bottom-1 -right-1 text-[11px] bg-black/65 rounded-full w-5 h-5 flex items-center justify-center">
                      {roomMeta.icon}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {plant.name}
                    </h4>

                    {/* Minimal Moisture Bar + Days Left */}
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                      <span>עוד {status.daysUntilNext} ימ׳</span>
                      <span className="text-sky-500 font-bold">{status.moisturePercent}%</span>
                    </div>
                    <div className="mt-1 w-full h-1.5 rounded-full bg-slate-100 dark:bg-void-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-500"
                        style={{ width: `${status.moisturePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick 1-Tap Water Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onWaterPlant(plant);
                    }}
                    title="סמן השקיה"
                    className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-sky-50 dark:bg-void-800 text-sky-500 flex items-center justify-center shrink-0 active:scale-90 transition"
                  >
                    <Droplets className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
