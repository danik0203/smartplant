import React, { useState } from 'react';
import {
  Droplets,
  Stethoscope,
  Plus,
  AlertTriangle,
  PawPrint
} from 'lucide-react';
import { Plant, PlantRoom } from '../types';
import {
  ROOM_LABELS,
  SUNLIGHT_LABELS,
  HEALTH_STATUS_META
} from '../services/mockPlants';
import { getPlantWateringStatus } from '../utils/plantCalculations';

interface MyPlantsTabProps {
  plants: Plant[];
  onSelectPlant: (plant: Plant) => void;
  onWaterPlant: (plant: Plant) => void;
  onOpenAddPlant: () => void;
  onOpenDoctorForPlant: (plant: Plant) => void;
}

export const MyPlantsTab: React.FC<MyPlantsTabProps> = ({
  plants,
  onSelectPlant,
  onWaterPlant,
  onOpenAddPlant,
  onOpenDoctorForPlant
}) => {
  const [selectedRoom, setSelectedRoom] = useState<PlantRoom | 'all'>('all');

  const filteredPlants = plants.filter(
    (p) => selectedRoom === 'all' || p.room === selectedRoom
  );

  const roomKeys = Object.keys(ROOM_LABELS) as PlantRoom[];

  return (
    <div className="space-y-4 pb-24">
      {/* Minimalist Room Icon Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <button
          onClick={() => setSelectedRoom('all')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap flex items-center gap-1.5 transition ${
            selectedRoom === 'all'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-void-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10'
          }`}
        >
          <span>🏠</span>
          <span>הכל ({plants.length})</span>
        </button>

        {roomKeys.map((roomKey) => {
          const count = plants.filter((p) => p.room === roomKey).length;
          if (count === 0 && selectedRoom !== roomKey) return null;
          const meta = ROOM_LABELS[roomKey];
          return (
            <button
              key={roomKey}
              onClick={() => setSelectedRoom(roomKey)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition ${
                selectedRoom === roomKey
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-void-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10'
              }`}
            >
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
              <span className="text-[10px] opacity-75">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Modern Minimalist 2-Column Visual Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredPlants.map((plant) => {
          const roomMeta = ROOM_LABELS[plant.room] || ROOM_LABELS.living_room;
          const sunMeta = SUNLIGHT_LABELS[plant.sunlight] || SUNLIGHT_LABELS.bright_indirect;
          const healthMeta = HEALTH_STATUS_META[plant.healthStatus] || HEALTH_STATUS_META.healthy;
          const waterStatus = getPlantWateringStatus(plant);
          const isThirsty =
            waterStatus.urgency === 'overdue' || waterStatus.urgency === 'due_today';

          return (
            <div
              key={plant.id}
              onClick={() => onSelectPlant(plant)}
              className="rounded-3xl bg-white dark:bg-void-900 border border-slate-200/90 dark:border-white/10 overflow-hidden shadow-sm hover:border-emerald-500/50 hover:shadow-md transition flex flex-col cursor-pointer"
            >
              {/* Visual Photo Header */}
              <div className="relative h-32 w-full bg-slate-100 dark:bg-void-800 shrink-0">
                <img
                  src={plant.imageUrl}
                  alt={plant.name}
                  className="w-full h-full object-cover"
                />

                {/* Top Right: Room Icon Pill */}
                <span
                  className="absolute top-2 right-2 w-7 h-7 rounded-xl bg-black/60 backdrop-blur-md text-xs flex items-center justify-center text-white shadow-sm"
                  title={roomMeta.label}
                >
                  {roomMeta.icon}
                </span>

                {/* Top Left: Health Score Pill */}
                <span
                  className={`absolute top-2 left-2 px-2 py-0.5 rounded-xl border text-[10px] font-black backdrop-blur-md shadow-sm ${healthMeta.badgeClass}`}
                >
                  {healthMeta.icon} {plant.healthScore}%
                </span>

                {/* Issue Indicator Dot */}
                {plant.currentIssues && plant.currentIssues.length > 0 && (
                  <span
                    className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-lg bg-amber-500 text-white text-[10px] font-bold flex items-center gap-0.5 shadow"
                    title={plant.currentIssues[0]}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>דורש יחס</span>
                  </span>
                )}
              </div>

              {/* Clean Readable Card Body (Below Image - Text NEVER disappears) */}
              <div className="p-3 flex-1 flex flex-col justify-between gap-2.5">
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white line-clamp-1">
                    {plant.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold line-clamp-1">
                    {plant.species || roomMeta.label}
                  </p>
                </div>

                {/* Specs Pill Row */}
                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-bold border-t border-slate-100 dark:border-white/5 pt-2">
                  <span
                    className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-black"
                    title={`השקיה כל ${plant.wateringFrequencyDays} ימים`}
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    <span>כל {plant.wateringFrequencyDays} ימ׳</span>
                  </span>

                  <span title={sunMeta.label}>{sunMeta.icon}</span>

                  {plant.isPetSafe && (
                    <span title="ידידותי לחיות מחמד" className="text-emerald-600">
                      <PawPrint className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                {/* 1-Tap Action Row */}
                <div
                  className="flex items-center gap-1.5 pt-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onWaterPlant(plant)}
                    className={`flex-1 py-2 px-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition ${
                      isThirsty
                        ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-sm shadow-sky-500/25'
                        : 'bg-slate-100 hover:bg-sky-50 dark:bg-void-800 dark:hover:bg-void-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    <span>{isThirsty ? 'השקה עכשיו' : `עוד ${waterStatus.daysUntilNext} ימים`}</span>
                  </button>

                  <button
                    onClick={() => onOpenDoctorForPlant(plant)}
                    title="אבחון רופא AI"
                    className="w-9 h-9 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center active:scale-95 transition shrink-0"
                  >
                    <Stethoscope className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Minimal Add Tile */}
        <button
          onClick={onOpenAddPlant}
          className="rounded-3xl border-2 border-dashed border-slate-300 dark:border-white/15 min-h-[210px] flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-emerald-600 hover:border-emerald-500/50 transition active:scale-95"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-void-900 text-emerald-600 flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-xs font-extrabold">הוסף צמח</span>
        </button>
      </div>
    </div>
  );
};
