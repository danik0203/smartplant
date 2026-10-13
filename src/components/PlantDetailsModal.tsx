import React, { useState } from 'react';
import {
  X,
  Droplets,
  Clock,
  Sun,
  Wind,
  Sprout,
  SprayCan,
  AlertTriangle,
  Check,
  Stethoscope,
  Edit3,
  Trash2,
  Plus,
  Sparkles,
  PawPrint
} from 'lucide-react';
import { Plant } from '../types';
import {
  ROOM_LABELS,
  SOIL_TYPE_LABELS,
  SUNLIGHT_LABELS,
  HUMIDITY_LABELS,
  HEALTH_STATUS_META
} from '../services/mockPlants';
import { getPlantWateringStatus, formatRelativeDateHe } from '../utils/plantCalculations';

interface PlantDetailsModalProps {
  plant: Plant | null;
  onClose: () => void;
  onWaterPlant: (plant: Plant) => void;
  onSnoozePlant: (plant: Plant, days?: number) => void;
  onMistPlant: (plant: Plant) => void;
  onFertilizePlant: (plant: Plant) => void;
  onEditPlant: (plant: Plant) => void;
  onDeletePlant: (plantId: string) => void;
  onOpenDoctorForPlant: (plant: Plant) => void;
  onUpdatePlant: (updated: Plant) => void;
}

export const PlantDetailsModal: React.FC<PlantDetailsModalProps> = ({
  plant,
  onClose,
  onWaterPlant,
  onSnoozePlant,
  onMistPlant,
  onFertilizePlant,
  onEditPlant,
  onDeletePlant,
  onOpenDoctorForPlant,
  onUpdatePlant
}) => {
  const [newIssueText, setNewIssueText] = useState('');
  const [showAddIssue, setShowAddIssue] = useState(false);

  if (!plant) return null;

  const roomMeta = ROOM_LABELS[plant.room] || ROOM_LABELS.living_room;
  const soilMeta = SOIL_TYPE_LABELS[plant.soilType] || SOIL_TYPE_LABELS.all_purpose;
  const sunMeta = SUNLIGHT_LABELS[plant.sunlight] || SUNLIGHT_LABELS.bright_indirect;
  const humMeta = HUMIDITY_LABELS[plant.humidity] || HUMIDITY_LABELS.medium;
  const healthMeta = HEALTH_STATUS_META[plant.healthStatus] || HEALTH_STATUS_META.healthy;
  const waterStatus = getPlantWateringStatus(plant);

  const handleResolveIssue = (idx: number) => {
    const remaining = plant.currentIssues.filter((_, i) => i !== idx);
    onUpdatePlant({
      ...plant,
      currentIssues: remaining,
      healthStatus: remaining.length === 0 ? 'healthy' : plant.healthStatus,
      healthScore: remaining.length === 0 ? Math.max(plant.healthScore, 92) : plant.healthScore
    });
  };

  const handleAddIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssueText.trim()) return;
    onUpdatePlant({
      ...plant,
      currentIssues: [...(plant.currentIssues || []), newIssueText.trim()],
      healthStatus: 'needs_attention'
    });
    setNewIssueText('');
    setShowAddIssue(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#FAF8F5] dark:bg-void-950 w-full max-w-md sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80 dark:border-white/10 flex flex-col">
        {/* Compact Visual Header */}
        <div className="relative h-52 w-full shrink-0 bg-slate-900">
          <img src={plant.imageUrl} alt={plant.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

          {/* Top Floating Icon Controls */}
          <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md active:scale-90 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  onClose();
                  onEditPlant(plant);
                }}
                title="ערוך"
                className="w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md active:scale-90 transition"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`למחוק את "${plant.name}"?`)) {
                    onDeletePlant(plant.id);
                    onClose();
                  }
                }}
                title="מחק"
                className="w-9 h-9 rounded-full bg-rose-600/80 text-white flex items-center justify-center backdrop-blur-md active:scale-90 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Plant Title & Minimal Badges */}
          <div className="absolute bottom-3.5 inset-x-4 text-white flex items-end justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="px-2 py-0.5 rounded-lg bg-white/20 backdrop-blur-md text-[11px] font-bold">
                  {roomMeta.icon} {roomMeta.label}
                </span>
                {plant.isPetSafe && (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/40 backdrop-blur-md text-[11px] font-bold flex items-center gap-1">
                    <PawPrint className="w-3 h-3" /> בטוח
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black leading-tight">{plant.name}</h2>
              <span className="text-[11px] text-emerald-200 italic">{plant.species}</span>
            </div>

            <span className={`px-2.5 py-1 rounded-xl border text-xs font-black ${healthMeta.badgeClass}`}>
              {healthMeta.icon} {plant.healthScore}%
            </span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* 1-Tap 5-Icon Action Dock */}
          <div className="grid grid-cols-5 gap-2">
            <button
              onClick={() => onWaterPlant(plant)}
              className="col-span-2 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-xs flex flex-col items-center justify-center gap-1 shadow-md shadow-sky-500/20 active:scale-95 transition"
            >
              <Droplets className="w-5 h-5 fill-white/25" />
              <span>השקה ({plant.waterAmountMl}ml)</span>
            </button>

            <button
              onClick={() => onSnoozePlant(plant, 2)}
              className="py-3 rounded-2xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex flex-col items-center justify-center gap-1 active:scale-95 transition"
            >
              <Clock className="w-5 h-5 text-amber-500" />
              <span>דחה +2ד׳</span>
            </button>

            <button
              onClick={() => onMistPlant(plant)}
              className="py-3 rounded-2xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex flex-col items-center justify-center gap-1 active:scale-95 transition"
            >
              <SprayCan className="w-5 h-5 text-teal-500" />
              <span>רסס</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenDoctorForPlant(plant);
              }}
              className="py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex flex-col items-center justify-center gap-1 active:scale-95 transition"
            >
              <Stethoscope className="w-5 h-5" />
              <span>אבחן AI</span>
            </button>
          </div>

          {/* 2x2 Visual Icon Tiles (Minimal Text) */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Watering */}
            <div className="rounded-2xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 p-3 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center shrink-0">
                <Droplets className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 block">תדירות השקיה</span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate">
                  כל {plant.wateringFrequencyDays} ימים
                </span>
                <span className="text-[10px] text-slate-500">
                  הושקה {formatRelativeDateHe(plant.lastWateredAt)}
                </span>
              </div>
            </div>

            {/* Soil */}
            <div className="rounded-2xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 p-3 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0 text-base">
                🪴
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 block">סוג קרקע</span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate">
                  {soilMeta.label.replace('אדמת שתילה ', '').replace('מצע מנוקז ל', '')}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {plant.hasDrainageHole ? '✓ עם ניקוז' : '⚠️ ללא ניקוז'}
                </span>
              </div>
            </div>

            {/* Sunlight */}
            <div className="rounded-2xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 p-3 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-yellow-50 dark:bg-yellow-950/60 text-amber-500 flex items-center justify-center shrink-0">
                <Sun className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 block">תאורה</span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate">
                  {sunMeta.label}
                </span>
              </div>
            </div>

            {/* Humidity & Temp */}
            <div className="rounded-2xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 p-3 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-500 flex items-center justify-center shrink-0">
                <Wind className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 block">טמפ׳ ולחות</span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate">
                  {plant.temperatureRange}
                </span>
                <span className="text-[10px] text-slate-500 truncate block">{humMeta.label}</span>
              </div>
            </div>
          </div>

          {/* Issues Chips (Compact) */}
          <div className="rounded-2xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>בעיות במעקב ({plant.currentIssues?.length || 0})</span>
              </span>
              <button
                onClick={() => setShowAddIssue(!showAddIssue)}
                className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-void-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {showAddIssue && (
              <form onSubmit={handleAddIssue} className="flex gap-1.5">
                <input
                  type="text"
                  value={newIssueText}
                  onChange={(e) => setNewIssueText(e.target.value)}
                  placeholder="למשל: קצוות יבשים..."
                  className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-void-800 border border-slate-200 dark:border-white/10 text-xs"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                >
                  שמור
                </button>
              </form>
            )}

            {(!plant.currentIssues || plant.currentIssues.length === 0) ? (
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>ללא בעיות פתוחות</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {plant.currentIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-amber-50 dark:bg-amber-950/40 px-3 py-2 flex items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200"
                  >
                    <span className="truncate">{issue}</span>
                    <button
                      onClick={() => handleResolveIssue(idx)}
                      title="סמן כטופל"
                      className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Concise Care Tips */}
          {plant.careRecommendations && plant.careRecommendations.length > 0 && (
            <div className="rounded-2xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 p-3.5 space-y-2">
              <span className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>טיפים לבית</span>
              </span>
              <div className="space-y-1.5">
                {plant.careRecommendations.slice(0, 3).map((rec, i) => (
                  <div
                    key={i}
                    className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-void-800/70 rounded-xl px-3 py-2 flex items-start gap-2"
                  >
                    <span>🌱</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
