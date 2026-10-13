import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  Loader2,
  Droplets,
  Sun,
  Check,
  SlidersHorizontal,
  ShieldAlert,
  Minus,
  Plus
} from 'lucide-react';
import {
  Plant,
  PlantRoom,
  SoilType,
  SunlightLevel,
  HumidityLevel,
  PlantHealthStatus
} from '../types';
import {
  ROOM_LABELS,
  SOIL_TYPE_LABELS,
  SUNLIGHT_LABELS,
  PLANT_PRESETS,
  PlantPreset
} from '../services/mockPlants';
import { analyzeNewPlantPhotoWithAI, getStoredGeminiKey } from '../services/geminiPlantAi';

interface AddPlantModalProps {
  onClose: () => void;
  onSavePlant: (newPlant: Plant) => void;
  currentMemberName: string;
  plantToEdit?: Plant | null;
}

export const AddPlantModal: React.FC<AddPlantModalProps> = ({
  onClose,
  onSavePlant,
  currentMemberName,
  plantToEdit
}) => {
  const [name, setName] = useState(plantToEdit?.name || PLANT_PRESETS[0].name);
  const [species, setSpecies] = useState(plantToEdit?.species || PLANT_PRESETS[0].species);
  const [room, setRoom] = useState<PlantRoom>(plantToEdit?.room || 'living_room');
  const [imageUrl, setImageUrl] = useState(plantToEdit?.imageUrl || PLANT_PRESETS[0].imageUrl);
  const [wateringFrequencyDays, setWateringFrequencyDays] = useState(
    plantToEdit?.wateringFrequencyDays || PLANT_PRESETS[0].wateringFrequencyDays
  );
  const [waterAmountMl, setWaterAmountMl] = useState(
    plantToEdit?.waterAmountMl || PLANT_PRESETS[0].waterAmountMl
  );
  const [wateringTips, setWateringTips] = useState(
    plantToEdit?.wateringTips || PLANT_PRESETS[0].wateringTips
  );
  const [soilType, setSoilType] = useState<SoilType>(
    plantToEdit?.soilType || PLANT_PRESETS[0].soilType
  );
  const [soilDescription, setSoilDescription] = useState(
    plantToEdit?.soilDescription || PLANT_PRESETS[0].soilDescription
  );
  const [hasDrainageHole, setHasDrainageHole] = useState(plantToEdit?.hasDrainageHole ?? true);
  const [sunlight, setSunlight] = useState<SunlightLevel>(
    plantToEdit?.sunlight || PLANT_PRESETS[0].sunlight
  );
  const [humidity, setHumidity] = useState<HumidityLevel>(
    plantToEdit?.humidity || PLANT_PRESETS[0].humidity
  );
  const [temperatureRange, setTemperatureRange] = useState(
    plantToEdit?.temperatureRange || PLANT_PRESETS[0].temperatureRange
  );
  const [fertilizeFrequencyDays, setFertilizeFrequencyDays] = useState(
    plantToEdit?.fertilizeFrequencyDays || 30
  );
  const [mistFrequencyDays, setMistFrequencyDays] = useState(
    plantToEdit?.mistFrequencyDays || 3
  );
  const [isPetSafe, setIsPetSafe] = useState(plantToEdit?.isPetSafe ?? false);
  const [healthStatus, setHealthStatus] = useState<PlantHealthStatus>(
    plantToEdit?.healthStatus || 'healthy'
  );
  const [healthScore, setHealthScore] = useState(plantToEdit?.healthScore || 92);
  const [currentIssues, setCurrentIssues] = useState<string[]>(plantToEdit?.currentIssues || []);
  const [careRecommendations, setCareRecommendations] = useState<string[]>(
    plantToEdit?.careRecommendations || PLANT_PRESETS[0].careRecommendations
  );

  // Minimal UI Toggles
  const [showCustomControls, setShowCustomControls] = useState<boolean>(Boolean(plantToEdit));
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanError, setScanError] = useState('');
  const [aiScanned, setAiScanned] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleApplyPreset = (p: PlantPreset) => {
    setName(p.name);
    setSpecies(p.species);
    setImageUrl(p.imageUrl);
    setWateringFrequencyDays(p.wateringFrequencyDays);
    setWaterAmountMl(p.waterAmountMl);
    setWateringTips(p.wateringTips);
    setSoilType(p.soilType);
    setSoilDescription(p.soilDescription);
    setSunlight(p.sunlight);
    setHumidity(p.humidity);
    setTemperatureRange(p.temperatureRange);
    setFertilizeFrequencyDays(p.fertilizeFrequencyDays);
    setMistFrequencyDays(p.mistFrequencyDays);
    setIsPetSafe(p.isPetSafe);
    setCareRecommendations(p.careRecommendations);
    setAiScanned(false);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanError('');

    try {
      const apiKey = getStoredGeminiKey();
      const { photoDataUrl, analysis } = await analyzeNewPlantPhotoWithAI(
        file,
        apiKey,
        (progress) => setScanProgress(progress)
      );

      setImageUrl(photoDataUrl);
      setName(analysis.name);
      setSpecies(analysis.species);
      setWateringFrequencyDays(analysis.wateringFrequencyDays);
      setWaterAmountMl(analysis.waterAmountMl);
      setWateringTips(analysis.wateringTips);
      setSoilType(analysis.soilType);
      setSoilDescription(analysis.soilDescription);
      setSunlight(analysis.sunlight);
      setHumidity(analysis.humidity);
      setTemperatureRange(analysis.temperatureRange);
      setFertilizeFrequencyDays(analysis.fertilizeFrequencyDays);
      setMistFrequencyDays(analysis.mistFrequencyDays);
      setIsPetSafe(analysis.isPetSafe);
      setHealthStatus(analysis.healthStatus);
      setHealthScore(analysis.healthScore);
      setCurrentIssues(analysis.currentIssues);
      setCareRecommendations(analysis.careRecommendations);
      setAiScanned(true);
    } catch (err: any) {
      setScanError(err.message || 'שגיאה בסריקה');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const savedPlant: Plant = {
      id: plantToEdit?.id || `plant_${Date.now()}`,
      name: name.trim(),
      species: species.trim() || 'צמח בית',
      room,
      imageUrl,
      wateringFrequencyDays,
      waterAmountMl,
      wateringTips,
      lastWateredAt: plantToEdit?.lastWateredAt || new Date().toISOString(),
      lastWateredBy: plantToEdit?.lastWateredBy || currentMemberName,
      snoozedUntil: plantToEdit?.snoozedUntil,
      fertilizeFrequencyDays,
      lastFertilizedAt: plantToEdit?.lastFertilizedAt,
      mistFrequencyDays,
      lastMistedAt: plantToEdit?.lastMistedAt,
      soilType,
      soilDescription,
      hasDrainageHole,
      sunlight,
      humidity,
      temperatureRange,
      isPetSafe,
      healthStatus,
      healthScore,
      currentIssues,
      careRecommendations,
      diagnosisHistory: plantToEdit?.diagnosisHistory || [],
      createdAt: plantToEdit?.createdAt || Date.now()
    };

    onSavePlant(savedPlant);
    onClose();
  };

  const roomKeys = Object.keys(ROOM_LABELS) as PlantRoom[];

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#FAF8F5] dark:bg-void-950 w-full max-w-md sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80 dark:border-white/10 flex flex-col">
        {/* Minimalist Header */}
        <div className="px-4 py-3.5 border-b border-slate-200/70 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 dark:text-white">
            {plantToEdit ? 'עריכת צמח' : 'הוספת צמח'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 dark:bg-void-800 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* 1-Tap AI Camera Scanner */}
          {!plantToEdit && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="w-full rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white p-4 flex items-center justify-between shadow-lg shadow-emerald-600/25 active:scale-[0.99] transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    {isScanning ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6" />
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm sm:text-base block">
                      {isScanning ? `מנתח צילום AI... ${scanProgress}%` : 'צלם לזיהוי AI אוטומטי'}
                    </span>
                    <span className="text-xs text-emerald-100 block">
                      מזהה צמח, קרקע והשקיה בלחיצה אחת
                    </span>
                  </div>
                </div>
                <Sparkles className="w-5 h-5 text-emerald-200 shrink-0" />
              </button>

              {scanError && (
                <div className="mt-2 bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 rounded-2xl p-2.5 text-xs font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}
            </div>
          )}

          {/* Selected Plant Visual Preview Card */}
          <div className="rounded-3xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 p-3 flex items-center gap-3 shadow-sm">
            <img
              src={imageUrl}
              alt={name}
              className="w-16 h-16 rounded-2xl object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                  {name}
                </h3>
                {aiScanned && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                    AI ✨
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-bold">
                <span className="text-sky-600 dark:text-sky-400 flex items-center gap-0.5">
                  <Droplets className="w-3.5 h-3.5" />
                  כל {wateringFrequencyDays}ד׳ ({waterAmountMl}ml)
                </span>
                <span>•</span>
                <span>{SUNLIGHT_LABELS[sunlight]?.icon}</span>
                <span>•</span>
                <span>🪴</span>
              </div>
            </div>
          </div>

          {/* Visual 1-Tap Preset Grid (if not AI scanned) */}
          {!plantToEdit && !aiScanned && (
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-slate-400 px-1 block">
                או בחר בלחיצה מקטלוג מהיר:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {PLANT_PRESETS.map((preset) => {
                  const isSelected = name === preset.name;
                  return (
                    <button
                      key={preset.species}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`rounded-2xl p-2 border text-right transition flex flex-col items-center gap-1.5 active:scale-95 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/30'
                          : 'border-slate-200/80 dark:border-white/10 bg-white dark:bg-void-900'
                      }`}
                    >
                      <img
                        src={preset.imageUrl}
                        alt={preset.name}
                        className="w-full h-14 rounded-xl object-cover"
                      />
                      <span className="text-[11px] font-bold text-slate-800 dark:text-white truncate w-full text-center">
                        {preset.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 1-Tap Room Icon Picker */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-extrabold text-slate-400 px-1 block">מיקום בבית:</span>
            <div className="grid grid-cols-4 gap-1.5">
              {roomKeys.slice(0, 4).map((rk) => {
                const meta = ROOM_LABELS[rk];
                const active = room === rk;
                return (
                  <button
                    key={rk}
                    type="button"
                    onClick={() => setRoom(rk)}
                    className={`py-2 px-2 rounded-2xl text-xs font-bold flex flex-col items-center gap-0.5 border transition active:scale-95 ${
                      active
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-void-900 border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-base">{meta.icon}</span>
                    <span className="text-[10px]">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggle Manual Fine-Tuning */}
          <button
            type="button"
            onClick={() => setShowCustomControls(!showCustomControls)}
            className="w-full py-2 px-3 rounded-2xl bg-slate-100 dark:bg-void-900 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showCustomControls ? 'הסתר התאמה ידנית' : 'התאמת שם, השקיה וקרקע ידנית'}</span>
          </button>

          {/* Compact Stepper & Icon Controls (Only when expanded) */}
          {showCustomControls && (
            <div className="rounded-3xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 p-3.5 space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="שם הצמח..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-void-800 border border-slate-200 dark:border-white/10 text-xs font-bold"
              />

              {/* Watering Days Stepper */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-sky-500" />
                  <span>תדירות השקיה</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setWateringFrequencyDays(Math.max(1, wateringFrequencyDays - 1))}
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-void-800 flex items-center justify-center"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-black w-16 text-center">
                    {wateringFrequencyDays} ימים
                  </span>
                  <button
                    type="button"
                    onClick={() => setWateringFrequencyDays(Math.min(45, wateringFrequencyDays + 1))}
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-void-800 flex items-center justify-center"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Sunlight Icon Selector */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">תאורה:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(SUNLIGHT_LABELS) as SunlightLevel[]).map((sk) => (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => setSunlight(sk)}
                      className={`py-1.5 rounded-xl text-[10px] font-bold flex flex-col items-center gap-0.5 border ${
                        sunlight === sk
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-slate-50 dark:bg-void-800 border-slate-200 dark:border-white/10'
                      }`}
                    >
                      <span>{SUNLIGHT_LABELS[sk].icon}</span>
                      <span className="truncate max-w-full px-1">
                        {SUNLIGHT_LABELS[sk].label.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Soil Pill Selector */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">סוג קרקע:</span>
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value as SoilType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-void-800 border border-slate-200 dark:border-white/10 text-xs font-bold"
                >
                  {Object.entries(SOIL_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      🪴 {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 1-Tap Save Button */}
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-98 transition"
          >
            <Check className="w-5 h-5" />
            <span>{plantToEdit ? 'שמור שינויים' : `הוסף את ${name}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
