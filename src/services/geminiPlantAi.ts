import {
  AIPlantAnalysisResult,
  Plant,
  PlantDiagnosisRecord,
  PlantHealthStatus,
  SoilType,
  SunlightLevel,
  HumidityLevel
} from '../types';

export const GEMINI_KEY_STORAGE = 'plants_care_gemini_api_key';

export function getStoredGeminiKey(): string {
  return (
    localStorage.getItem(GEMINI_KEY_STORAGE) ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    ''
  );
}

export function saveStoredGeminiKey(key: string): void {
  if (key.trim()) {
    localStorage.setItem(GEMINI_KEY_STORAGE, key.trim());
  } else {
    localStorage.removeItem(GEMINI_KEY_STORAGE);
  }
}

/**
 * Compresses and resizes a camera/gallery photo to a clean JPEG DataURL for fast AI analysis and local/cloud storage
 */
export async function compressPlantPhoto(file: File | Blob, maxDimension = 1000): Promise<{
  dataUrl: string;
  base64: string;
  mimeType: string;
  blob?: Blob;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          const fallbackUrl = e.target?.result as string;
          const [header, b64] = fallbackUrl.split(',');
          const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
          resolve({ dataUrl: fallbackUrl, base64: b64, mimeType: mime });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        const [, base64] = dataUrl.split(',');

        canvas.toBlob(
          (blob) => {
            resolve({
              dataUrl,
              base64,
              mimeType: 'image/jpeg',
              blob: blob || undefined
            });
          },
          'image/jpeg',
          0.82
        );
      };
      img.onerror = (err) => reject(err);
      img.src = e.target?.result as string;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

const CANDIDATE_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-flash-latest',
  'gemini-1.5-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash'
];

async function callGeminiVisionJson(
  prompt: string,
  base64Image: string,
  mimeType: string,
  apiKey: string
): Promise<any> {
  let lastError = '';

  for (const model of CANDIDATE_GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType,
                    data: base64Image
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (rawText) {
          const cleaned = rawText.replace(/```json|```/g, '').trim();
          return JSON.parse(cleaned);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        lastError = errData?.error?.message || `HTTP ${response.status}`;
      }
    } catch (err: any) {
      lastError = err.message || 'Network error';
    }
  }

  throw new Error(lastError || 'לא הצלחנו להתחבר למנוע ה-AI של Gemini. בדוק את חיבור האינטרנט או מפתח ה-API בהגדרות.');
}

/**
 * Identifies a plant from a photo and generates a complete care profile + initial health diagnosis in Hebrew
 */
export async function analyzeNewPlantPhotoWithAI(
  imageFile: File | Blob,
  apiKey: string,
  onProgress?: (progress: number, statusText: string) => void
): Promise<{ photoDataUrl: string; analysis: AIPlantAnalysisResult }> {
  onProgress?.(15, 'מכווץ ומכין את תמונת הצמח לניתוח...');
  const { dataUrl, base64, mimeType } = await compressPlantPhoto(imageFile, 1024);

  onProgress?.(45, 'Gemini AI מזהה את סוג הצמח, מצב העלים והקרקע...');

  const prompt = `You are an expert Israeli botanist and indoor houseplant specialist.
Examine this photo of a plant carefully. Identify the plant species, assess its visible health condition (leaves, stems, soil if visible), and generate an accurate indoor care plan in Hebrew suitable for an Israeli home climate.

Return ONLY a valid JSON object matching this exact schema:
{
  "name": "שם הצמח בעברית (למשל: מונסטרה דליציוזה / פותוס זהוב / פיקוס כינורי)",
  "species": "Scientific Latin name (e.g. Monstera deliciosa)",
  "confidence": 95,
  "wateringFrequencyDays": 7,
  "waterAmountMl": 300,
  "wateringTips": "הנחיית השקיה מעשית בעברית (מתי להשקות, איך לבדוק את האדמה עם האצבע)",
  "soilType": "one of: all_purpose | airy_aroid | cactus_succulent | peat_rich | orchid_bark",
  "soilDescription": "תיאור סוג הקרקע והניקוז המומלץ בעברית",
  "sunlight": "one of: direct_sun | bright_indirect | medium_light | low_light",
  "humidity": "one of: high | medium | low",
  "temperatureRange": "18°C - 28°C",
  "fertilizeFrequencyDays": 30,
  "mistFrequencyDays": 3,
  "isPetSafe": false,
  "healthStatus": "one of: thriving | healthy | needs_attention | critical",
  "healthScore": 88,
  "currentIssues": ["רשימת בעיות שנראות בתמונה בעברית, או מערך ריק אם הצמח נראה בריא לחלוטין"],
  "careRecommendations": [
    "המלצה מעשית 1 לשמירה על הצמח בריא בבית",
    "המלצה מעשית 2",
    "המלצה מעשית 3"
  ],
  "treatmentSteps": [
    "אם זוהתה בעיה בתמונה - שלבי טיפול מומלצים בעברית"
  ],
  "diagnosisSummary": "סיכום קצר וידידותי בעברית של מצב הצמח בתמונה"
}`;

  const rawResult = await callGeminiVisionJson(prompt, base64, mimeType, apiKey);

  onProgress?.(85, 'בונה פרופיל השקיה והמלצות מותאמות אישית...');

  const validSoils: SoilType[] = ['all_purpose', 'airy_aroid', 'cactus_succulent', 'peat_rich', 'orchid_bark'];
  const validSunlight: SunlightLevel[] = ['direct_sun', 'bright_indirect', 'medium_light', 'low_light'];
  const validHumidity: HumidityLevel[] = ['high', 'medium', 'low'];
  const validHealth: PlantHealthStatus[] = ['thriving', 'healthy', 'needs_attention', 'critical'];

  const analysis: AIPlantAnalysisResult = {
    name: String(rawResult.name || 'צמח בית ירוק').trim(),
    species: String(rawResult.species || 'Houseplant sp.').trim(),
    confidence: Math.min(100, Math.max(50, Number(rawResult.confidence) || 90)),
    wateringFrequencyDays: Math.min(45, Math.max(1, Math.round(Number(rawResult.wateringFrequencyDays) || 7))),
    waterAmountMl: Math.min(2000, Math.max(50, Math.round(Number(rawResult.waterAmountMl) || 250))),
    wateringTips: String(
      rawResult.wateringTips || 'השקו כאשר השכבה העליונה של האדמה (2-3 ס"מ) יבשה למגע, ורוקנו עודפי מים מהתחתית.'
    ),
    soilType: validSoils.includes(rawResult.soilType) ? rawResult.soilType : 'all_purpose',
    soilDescription: String(rawResult.soilDescription || 'אדמת שתילה מנוקזת ומאווררת היטב'),
    sunlight: validSunlight.includes(rawResult.sunlight) ? rawResult.sunlight : 'bright_indirect',
    humidity: validHumidity.includes(rawResult.humidity) ? rawResult.humidity : 'medium',
    temperatureRange: String(rawResult.temperatureRange || '18°C - 28°C'),
    fertilizeFrequencyDays: Math.max(0, Number(rawResult.fertilizeFrequencyDays) ?? 30),
    mistFrequencyDays: Math.max(0, Number(rawResult.mistFrequencyDays) ?? 0),
    isPetSafe: Boolean(rawResult.isPetSafe),
    healthStatus: validHealth.includes(rawResult.healthStatus) ? rawResult.healthStatus : 'healthy',
    healthScore: Math.min(100, Math.max(10, Math.round(Number(rawResult.healthScore) || 88))),
    currentIssues: Array.isArray(rawResult.currentIssues)
      ? rawResult.currentIssues.map((s: any) => String(s).trim()).filter(Boolean)
      : [],
    careRecommendations: Array.isArray(rawResult.careRecommendations) && rawResult.careRecommendations.length > 0
      ? rawResult.careRecommendations.map((s: any) => String(s).trim()).filter(Boolean)
      : [
          'הקפידו לבדוק את לחות האדמה עם האצבע לפני כל השקיה',
          'מקמו באזור מואר ללא שמש ישירה חזקה בצהריים',
          'ודאו שלעציץ יש חור ניקוז תקין בתחתית'
        ],
    treatmentSteps: Array.isArray(rawResult.treatmentSteps)
      ? rawResult.treatmentSteps.map((s: any) => String(s).trim()).filter(Boolean)
      : [],
    diagnosisSummary: String(rawResult.diagnosisSummary || 'הצמח זוהה בהצלחה ותוכנית ההשקיה הותאמה עבורו.')
  };

  onProgress?.(100, 'הזיהוי הושלם בהצלחה!');
  return { photoDataUrl: dataUrl, analysis };
}

/**
 * Diagnoses an existing or general plant's health issues from a fresh photo ("רופא הצמחים AI")
 */
export async function diagnosePlantHealthWithAI(
  imageFile: File | Blob,
  existingPlant: Plant | null,
  selectedSymptoms: string[],
  userNotes: string,
  apiKey: string,
  onProgress?: (progress: number, statusText: string) => void
): Promise<PlantDiagnosisRecord & { detectedPlantName?: string }> {
  onProgress?.(20, 'מכין את צילום העלים/הקרקע לבדיקת רופא הצמחים...');
  const { dataUrl, base64, mimeType } = await compressPlantPhoto(imageFile, 1024);

  onProgress?.(55, 'רופא הצמחים AI מנתח סימני מצוקה, השקיה ותאורה...');

  const plantContextStr = existingPlant
    ? `Existing Plant Context:
- Plant Name: ${existingPlant.name} (${existingPlant.species})
- Current Watering Schedule: Every ${existingPlant.wateringFrequencyDays} days (${existingPlant.waterAmountMl}ml)
- Current Soil Type: ${existingPlant.soilType} (${existingPlant.soilDescription})
- Has Drainage Hole: ${existingPlant.hasDrainageHole ? 'Yes' : 'No'}
- Current Sunlight: ${existingPlant.sunlight}`
    : 'No existing plant record selected (identify the plant from the photo as well).';

  const symptomsStr =
    selectedSymptoms.length > 0 || userNotes.trim()
      ? `User reported symptoms/notes: ${[...selectedSymptoms, userNotes.trim()].filter(Boolean).join(', ')}`
      : 'No manual symptoms reported - inspect the image thoroughly.';

  const prompt = `You are "רופא הצמחים AI" (AI Plant Doctor), an expert plant pathologist and indoor gardening advisor.
Analyze this plant photo and the context below to diagnose its health status, identify any watering errors (overwatering/underwatering), light issues, soil problems, nutrient deficiencies, or pests, and provide a clear recovery plan in Hebrew.

${plantContextStr}
${symptomsStr}

Return ONLY a valid JSON object with this exact schema:
{
  "detectedPlantName": "שם הצמח בעברית",
  "healthStatus": "one of: thriving | healthy | needs_attention | critical",
  "healthScore": 72,
  "summary": "אבחנה ברורה ומפורטת בעברית על מצב הצמח והגורם המרכזי לבעיה (או אישור שהצמח בריא)",
  "detectedIssues": [
    "פירוט בעיה 1 שזוהתה (למשל: הצהבת עלים תחתונים עקב עודף השקיה)",
    "פירוט בעיה 2 אם קיימת"
  ],
  "treatmentSteps": [
    "צעד מעשי 1 להבראת הצמח בבית",
    "צעד מעשי 2",
    "צעד מעשי 3"
  ],
  "suggestedWateringDays": 9,
  "suggestedSoilType": "one of: all_purpose | airy_aroid | cactus_succulent | peat_rich | orchid_bark",
  "suggestedSunlight": "one of: direct_sun | bright_indirect | medium_light | low_light"
}`;

  const raw = await callGeminiVisionJson(prompt, base64, mimeType, apiKey);

  onProgress?.(90, 'מסכם תוכנית טיפול והמלצות...');

  const validHealth: PlantHealthStatus[] = ['thriving', 'healthy', 'needs_attention', 'critical'];
  const validSoils: SoilType[] = ['all_purpose', 'airy_aroid', 'cactus_succulent', 'peat_rich', 'orchid_bark'];
  const validSunlight: SunlightLevel[] = ['direct_sun', 'bright_indirect', 'medium_light', 'low_light'];

  const record: PlantDiagnosisRecord & { detectedPlantName?: string } = {
    id: `diag_${Date.now()}`,
    date: new Date().toISOString(),
    imageUrl: dataUrl,
    detectedPlantName: String(raw.detectedPlantName || existingPlant?.name || 'צמח בית'),
    healthStatus: validHealth.includes(raw.healthStatus) ? raw.healthStatus : 'needs_attention',
    healthScore: Math.min(100, Math.max(10, Math.round(Number(raw.healthScore) || 75))),
    summary: String(raw.summary || 'בוצע ניתוח תמונה של הצמח.'),
    detectedIssues: Array.isArray(raw.detectedIssues)
      ? raw.detectedIssues.map((x: any) => String(x).trim()).filter(Boolean)
      : [],
    treatmentSteps: Array.isArray(raw.treatmentSteps) && raw.treatmentSteps.length > 0
      ? raw.treatmentSteps.map((x: any) => String(x).trim()).filter(Boolean)
      : ['בדקו את לחות הקרקע בעומק 3 ס"מ לפני ההשקיה הבאה', 'ודאו ניקוז תקין ותאורה מתאימה ללא שמש ישירה צורבת'],
    suggestedWateringDays: raw.suggestedWateringDays
      ? Math.min(45, Math.max(1, Math.round(Number(raw.suggestedWateringDays))))
      : undefined,
    suggestedSoilType: validSoils.includes(raw.suggestedSoilType) ? raw.suggestedSoilType : undefined,
    suggestedSunlight: validSunlight.includes(raw.suggestedSunlight) ? raw.suggestedSunlight : undefined
  };

  onProgress?.(100, 'האבחון מוכן!');
  return record;
}

export interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
  imageBase64?: string;
  imageMime?: string;
}

/**
 * Tests if a Gemini API Key is valid and functional
 */
export async function testGeminiApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { success: false, message: 'מפתח ריק. אנא הזן מפתח API של Gemini.' };
  }

  for (const model of CANDIDATE_GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'שלום, ענה במילה אחת בלבד: פועל' }] }],
          generationConfig: { maxOutputTokens: 10 }
        })
      });

      if (res.ok) {
        return { success: true, message: 'מפתח ה-Gemini תקין ומחובר בהצלחה! 🟢' };
      } else {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson?.error?.message || `שגיאת אימות ${res.status}`;
        if (res.status === 400 || res.status === 403 || res.status === 401) {
          return { success: false, message: `מפתח לא תקין: ${msg}` };
        }
      }
    } catch (e: any) {
      // Continue to next model if model specific
    }
  }

  return { success: false, message: 'לא הצלחנו לאמת את המפתח מול Google Gemini. בדוק את החיבור לרשת.' };
}

/**
 * Natural Conversational Bot with Garden Context and Photo Inspection ("הבוטנאי של הבית")
 */
export async function chatWithPlantAI(
  conversation: ChatHistoryItem[],
  gardenPlants: Plant[],
  apiKey: string
): Promise<string> {
  const keyToUse = apiKey.trim() || getStoredGeminiKey();
  if (!keyToUse) {
    throw new Error('חסר מפתח Gemini API. אנא הזן מפתח בהגדרות או בחלון הצ׳אט.');
  }

  const gardenSummary =
    gardenPlants.length > 0
      ? `הצמחים הקיימים בגינה של המשתמש כרגע:\n` +
        gardenPlants
          .map(
            (p) =>
              `- ${p.name} (${p.species}, ממוקם ב-${p.room}, השקיה כל ${p.wateringFrequencyDays} ימים, קרקע: ${p.soilType}, שמש: ${p.sunlight}, בריאות: ${p.healthStatus})`
          )
          .join('\n')
      : 'למשתמש עדיין אין צמחים רשומים באפליקציה.';

  const systemInstruction = `אתה "הבוטנאי של הבית" - מומחה בינה מלאכותית מוסמך לבוטניקה, גידול צמחי בית ומרפסת ורפואת צמחים מותאמת לאקלים הישראלי.
תפקידך לסייע למשתמש ולשותפיו לשמור על הצמחים שלהם ירוקים, שופעים ובריאים.

הקשר הגינה של המשתמש:
${gardenSummary}

כללים לתשובה:
1. ענה תמיד בעברית טבעית, חמה, מקצועית ומעשית.
2. השתמש באמוג'ים רלוונטיים (🌿, 💧, ☀️, 🩺) וסעיפים קצרים, ללא מלל ארוך ומייגע.
3. אם המשתמש מצרף תמונה, נתח אותה מיד: זהה את הצמח, בחן את העלים, הקרקע והמזיקים, ותן המלצה ממוקדת.
4. בהשקיות - תמיד הזכר לבדוק את לחות האדמה באצבע ולא רק להסתמך על לוח זמנים.
5. הצע פתרונות פשוטים וזמינים בכל בית בישראל (מי ברז מושהים, ניקוז, כיוון אור, כבול/פרלייט).`;

  const contents = conversation.map((msg) => {
    const parts: any[] = [];
    if (msg.text) {
      parts.push({ text: msg.text });
    }
    if (msg.imageBase64) {
      parts.push({
        inlineData: {
          mimeType: msg.imageMime || 'image/jpeg',
          data: msg.imageBase64
        }
      });
    }
    return {
      role: msg.role,
      parts
    };
  });

  let lastError = '';
  for (const model of CANDIDATE_GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyToUse}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1200
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      } else {
        const errData = await response.json().catch(() => ({}));
        lastError = errData?.error?.message || `HTTP ${response.status}`;
      }
    } catch (e: any) {
      lastError = e.message || 'שגיאת רשת';
    }
  }

  throw new Error(lastError || 'לא הצלחנו לקבל תשובה מ-Gemini.');
}

/**
 * Text to Speech (TTS) in Hebrew using Web Speech API
 */
export function speakTextHebrew(text: string): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  try {
    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/[*_#`~>]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .slice(0, 300); // speak first paragraphs nicely
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'he-IL';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
