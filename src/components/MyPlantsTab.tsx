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
              className="rounded-3xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-sm hover:border-emerald-500/40 transition flex flex-col cursor-pointer"
            >
              {/* Visual Photo Header */}
              <div className="relative h-36 w-full bg-slate-100 dark:bg-void-800">
                <img
                  src={plant.imageUrl}
                  alt={plant.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

                {/* Top Right: Room Icon Pill */}
                <span
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-xl bg-black/55 backdrop-blur-md text-xs flex items-center justify-center"
                  title={roomMeta.label}
                >
                  {roomMeta.icon}
                </span>

                {/* Top Left: Health Score Pill */}
                <span
                  className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-xl border text-[10px] font-black backdrop-blur-md ${healthMeta.badgeClass}`}
                >
                  {healthMeta.icon} {plant.healthScore}%
                </span>

                {/* Issue Indicator Dot */}
                {plant.currentIssues && plant.currentIssues.length > 0 && (
                  <span
                    className="absolute bottom-2.5 left-2.5 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow"
                    title={plant.currentIssues[0]}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </span>
                )}

                {/* Name Overlay */}
                <div className="absolute bottom-2.5 right-2.5 left-10 text-white">
                  <h3 className="font-extrabold text-sm leading-tight truncate">{plant.name}</h3>
                </div>
              </div>

              {/* Minimal Icon Metrics + 1-Tap Actions */}
              <div className="p-2.5 flex flex-col gap-2.5">
                {/* Icon Specs Row */}
                <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  <span
                    className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400"
                    title={`השקיה כל ${plant.wateringFrequencyDays} ימים`}
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    <span>{plant.wateringFrequencyDays}ד׳</span>
                  </span>

                  <span title={sunMeta.label}>{sunMeta.icon}</span>

                  <span title={plant.hasDrainageHole ? 'יש חור ניקוז' : 'ללא ניקוז'}>🪴</span>

                  {plant.isPetSafe && (
                    <span title="ידידותי לחיות מחמד" className="text-emerald-600">
                      <PawPrint className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                {/* 1-Tap Action Row */}
                <div
                  className="flex items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onWaterPlant(plant)}
                    className={`flex-1 py-2 px-2 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1 active:scale-95 transition ${
                      isThirsty
                        ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-sm shadow-sky-500/25'
                        : 'bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300'
                    }`}
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    <span>{isThirsty ? 'השקה' : `${waterStatus.daysUntilNext}ד׳`}</span>
                  </button>

                  <button
                    onClick={() => onOpenDoctorForPlant(plant)}
                    title="אבחון AI"
                    className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-emerald-50 dark:bg-void-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center active:scale-95 transition shrink-0"
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
