import React, { useState, useRef, useEffect } from 'react';
import {
  Stethoscope,
  Camera,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Droplets,
  Sun,
  Sprout
} from 'lucide-react';
import { Plant, PlantDiagnosisRecord } from '../types';
import { diagnosePlantHealthWithAI, getStoredGeminiKey } from '../services/geminiPlantAi';
import { SOIL_TYPE_LABELS, SUNLIGHT_LABELS } from '../services/mockPlants';

interface PlantDoctorTabProps {
  plants: Plant[];
  currentMemberName: string;
  onApplyDiagnosisToPlant: (plantId: string, diagnosis: PlantDiagnosisRecord) => void;
  initialSelectedPlantId?: string;
}

const SYMPTOM_CHIPS = [
  { id: 'עלים מצהיבים', icon: '🍂', label: 'הצהבה' },
  { id: 'קצוות יבשים ושחומים', icon: '🔥', label: 'קצוות יבשים' },
  { id: 'עלים שמוטים ונפולים', icon: '🥀', label: 'נבילה' },
  { id: 'נקודות או מזיקים על העלים', icon: '🕷️', label: 'מזיקים' },
  { id: 'עובש על האדמה', icon: '🍄', label: 'עובש בקרקע' }
];

export const PlantDoctorTab: React.FC<PlantDoctorTabProps> = ({
  plants,
  onApplyDiagnosisToPlant,
  initialSelectedPlantId
}) => {
  const [selectedPlantId, setSelectedPlantId] = useState<string>(
    initialSelectedPlantId || (plants.length > 0 ? plants[0].id : '')
  );
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisProgress, setDiagnosisProgress] = useState(0);
  const [diagnosisResult, setDiagnosisResult] = useState<
    (PlantDiagnosisRecord & { detectedPlantName?: string }) | null
  >(null);
  const [errorText, setErrorText] = useState('');
  const [appliedSuccessfully, setAppliedSuccessfully] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialSelectedPlantId) {
      setSelectedPlantId(initialSelectedPlantId);
    }
  }, [initialSelectedPlantId]);

  const selectedPlant = plants.find((p) => p.id === selectedPlantId) || null;

  const toggleSymptom = (symId: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symId) ? prev.filter((s) => s !== symId) : [...prev, symId]
    );
  };

  // Zero-Friction: Selecting/taking a photo immediately triggers the AI diagnosis!
  const handleFileSelectAndDiagnose = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setDiagnosisResult(null);
    setAppliedSuccessfully(false);
    setErrorText('');
    setIsDiagnosing(true);

    try {
      const apiKey = getStoredGeminiKey();
      const result = await diagnosePlantHealthWithAI(
        file,
        selectedPlant,
        selectedSymptoms,
        '',
        apiKey,
        (prog) => setDiagnosisProgress(prog)
      );
      setDiagnosisResult(result);
    } catch (err: any) {
      setErrorText(err.message || 'שגיאה באבחון התמונה');
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleApplyToPlant = () => {
    if (!diagnosisResult || !selectedPlant) return;
    onApplyDiagnosisToPlant(selectedPlant.id, diagnosisResult);
    setAppliedSuccessfully(true);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Step 1: Visual Plant Avatar Strip (1 Tap to Pick Plant) */}
      <div className="space-y-2">
        <span className="text-xs font-extrabold text-slate-400 px-1 block">1. בחר צמח לבדיקה:</span>
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {plants.map((p) => {
            const isSelected = p.id === selectedPlantId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedPlantId(p.id);
                  setAppliedSuccessfully(false);
                }}
                className={`p-2 rounded-2xl border flex items-center gap-2 shrink-0 transition active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white dark:bg-void-900 border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200'
                }`}
              >
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-9 h-9 rounded-xl object-cover shrink-0"
                />
                <span className="text-xs font-extrabold pl-1 max-w-[100px] truncate">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Optional Visual Symptom Icon Pills */}
      <div className="space-y-2">
        <span className="text-xs font-extrabold text-slate-400 px-1 block">
          2. סימנים נראים (אופציונלי):
        </span>
        <div className="flex flex-wrap gap-1.5">
          {SYMPTOM_CHIPS.map((chip) => {
            const active = selectedSymptoms.includes(chip.id);
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => toggleSymptom(chip.id)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 border transition active:scale-95 ${
                  active
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-white dark:bg-void-900 border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3: 1-Tap Camera Scan (Auto-starts AI Diagnosis) */}
      <div className="rounded-3xl bg-white dark:bg-void-900 border border-slate-200/80 dark:border-white/10 p-4 shadow-sm">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelectAndDiagnose}
          className="hidden"
        />

        {isDiagnosing ? (
          <div className="py-10 flex flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            <span className="font-extrabold text-sm text-slate-800 dark:text-white">
              רופא ה-AI מנתח את הצמח... ({diagnosisProgress}%)
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-7 rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/80 flex flex-col items-center justify-center gap-2 transition active:scale-[0.99]"
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="צילום"
                className="w-24 h-24 rounded-2xl object-cover shadow mb-1"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
                <Camera className="w-7 h-7" />
              </div>
            )}
            <span className="font-black text-sm text-slate-900 dark:text-white">
              {imagePreview ? 'צלם תמונה חדשה לבדיקה' : 'לחץ לצילום העלה או הקרקע 📸'}
            </span>
            <span className="text-[11px] text-slate-400">האבחון מתחיל אוטומטית מיד עם בחירת התמונה</span>
          </button>
        )}

        {errorText && (
          <div className="mt-3 bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorText}</span>
          </div>
        )}
      </div>

      {/* Minimalist Visual Diagnosis Result */}
      {diagnosisResult && (
        <div className="rounded-3xl bg-white dark:bg-void-900 border-2 border-emerald-500/40 p-4 space-y-3.5 shadow-lg">
          {/* Header Score */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-500" />
              <h3 className="font-black text-base text-slate-900 dark:text-white">תוצאת אבחון AI</h3>
            </div>
            <span className="px-3 py-1 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-black text-sm flex items-center gap-1">
              <HeartPulse className="w-4 h-4" />
              {diagnosisResult.healthScore}%
            </span>
          </div>

          {/* Concise Summary */}
          <p className="text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-void-800 p-3 rounded-2xl leading-relaxed font-medium">
            {diagnosisResult.summary}
          </p>

          {/* Issues & Action Steps as Compact Chips */}
          {diagnosisResult.treatmentSteps && diagnosisResult.treatmentSteps.length > 0 && (
            <div className="space-y-1.5">
              {diagnosisResult.treatmentSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="text-xs bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 px-3 py-2 rounded-xl flex items-start gap-2 font-semibold"
                >
                  <span className="text-emerald-600 font-black">{idx + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}

          {/* Recommended Schedule Badges */}
          <div className="flex flex-wrap gap-1.5">
            {diagnosisResult.suggestedWateringDays && (
              <span className="px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-bold flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5" />
                כל {diagnosisResult.suggestedWateringDays} ימים
              </span>
            )}
            {diagnosisResult.suggestedSoilType && (
              <span className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1">
                <Sprout className="w-3.5 h-3.5" />
                {SOIL_TYPE_LABELS[diagnosisResult.suggestedSoilType]?.label}
              </span>
            )}
            {diagnosisResult.suggestedSunlight && (
              <span className="px-2.5 py-1 rounded-xl bg-yellow-50 dark:bg-yellow-950/60 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1">
                <Sun className="w-3.5 h-3.5" />
                {SUNLIGHT_LABELS[diagnosisResult.suggestedSunlight]?.label}
              </span>
            )}
          </div>

          {/* 1-Tap Apply */}
          {selectedPlant && (
            <button
              onClick={handleApplyToPlant}
              disabled={appliedSuccessfully}
              className={`w-full py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition ${
                appliedSuccessfully
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 active:scale-95'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {appliedSuccessfully
                  ? `עודכן בכרטיס של ${selectedPlant.name} ✓`
                  : `עדכן תוכנית ל-${selectedPlant.name}`}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
