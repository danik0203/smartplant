export type PlantRoom =
  | 'living_room'
  | 'balcony'
  | 'bedroom'
  | 'kitchen'
  | 'bathroom'
  | 'office'
  | 'other';

export type SoilType =
  | 'all_purpose'      // אדמת שתילה אוניברסלית
  | 'airy_aroid'       // תערובת מאווררת (קליפות אורן, פרלייט, כבול)
  | 'cactus_succulent' // אדמה מנוקזת לקקטוסים וסוקולנטים
  | 'peat_rich'        // אדמה עשירה ושומרת לחות
  | 'orchid_bark';     // מצע סחלבים (קליפות עץ)

export type SunlightLevel =
  | 'direct_sun'       // שמש ישירה
  | 'bright_indirect'  // אור מלא ללא שמש ישירה
  | 'medium_light'     // חצי צל / אור בינוני
  | 'low_light';       // צל / מעט אור

export type HumidityLevel = 'high' | 'medium' | 'low';

export type PlantHealthStatus =
  | 'thriving'         // משגשג ומלבלב
  | 'healthy'          // בריא ויציב
  | 'needs_attention'  // דורש תשומת לב (בעיה קלה)
  | 'critical';        // במצוקה / דורש טיפול דחוף

export interface PlantDiagnosisRecord {
  id: string;
  date: string;
  imageUrl?: string;
  healthStatus: PlantHealthStatus;
  healthScore: number;
  summary: string;
  detectedIssues: string[];
  treatmentSteps: string[];
  suggestedWateringDays?: number;
  suggestedSoilType?: SoilType;
  suggestedSunlight?: SunlightLevel;
}

export interface Plant {
  id: string;
  name: string;
  nickname?: string;
  species: string;
  room: PlantRoom;
  imageUrl: string;
  wateringFrequencyDays: number;
  waterAmountMl: number;
  wateringTips: string;
  lastWateredAt: string; // ISO date string YYYY-MM-DD or full ISO
  lastWateredBy: string;
  snoozedUntil?: string; // ISO date string if soil was still wet
  fertilizeFrequencyDays: number;
  lastFertilizedAt?: string;
  mistFrequencyDays: number; // 0 = no misting needed
  lastMistedAt?: string;
  soilType: SoilType;
  soilDescription: string;
  hasDrainageHole: boolean;
  sunlight: SunlightLevel;
  humidity: HumidityLevel;
  temperatureRange: string;
  isPetSafe: boolean;
  healthStatus: PlantHealthStatus;
  healthScore: number; // 0 - 100
  currentIssues: string[];
  careRecommendations: string[];
  diagnosisHistory: PlantDiagnosisRecord[];
  householdId?: string;
  notes?: string;
  createdAt: number;
}

export type CareActionType =
  | 'watered'
  | 'fertilized'
  | 'misted'
  | 'snoozed'
  | 'diagnosed'
  | 'repotted'
  | 'added';

export interface PlantCareLog {
  id: string;
  householdId?: string;
  plantId: string;
  plantName: string;
  action: CareActionType;
  performedBy: string;
  timestamp: number;
  notes?: string;
}

export interface Household {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: number;
  createdBy?: string;
}

export interface HouseholdMember {
  id: string;
  householdId: string;
  userId: string;
  name: string;
  email?: string;
  avatar: string;
  color?: string;
  phone?: string;
  googleEmail?: string;
  picture?: string;
  role?: 'admin' | 'member';
  joinedAt?: number;
}

export interface GoogleUserProfile {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

export type ActiveTab = 'dashboard' | 'plants' | 'doctor' | 'history';

export interface AIPlantAnalysisResult {
  name: string;
  species: string;
  confidence: number;
  wateringFrequencyDays: number;
  waterAmountMl: number;
  wateringTips: string;
  soilType: SoilType;
  soilDescription: string;
  sunlight: SunlightLevel;
  humidity: HumidityLevel;
  temperatureRange: string;
  fertilizeFrequencyDays: number;
  mistFrequencyDays: number;
  isPetSafe: boolean;
  healthStatus: PlantHealthStatus;
  healthScore: number;
  currentIssues: string[];
  careRecommendations: string[];
  treatmentSteps: string[];
  diagnosisSummary: string;
}
