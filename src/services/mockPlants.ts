import {
  Plant,
  PlantCareLog,
  HouseholdMember,
  PlantRoom,
  SoilType,
  SunlightLevel,
  HumidityLevel,
  PlantHealthStatus
} from '../types';

export const ROOM_LABELS: Record<PlantRoom, { label: string; icon: string }> = {
  living_room: { label: 'סלון', icon: '🛋️' },
  balcony: { label: 'מרפסת', icon: '☀️' },
  bedroom: { label: 'חדר שינה', icon: '🛏️' },
  kitchen: { label: 'מטבח', icon: '🍳' },
  bathroom: { label: 'חדר רחצה', icon: '🚿' },
  office: { label: 'פינת עבודה', icon: '💻' },
  other: { label: 'אחר בבית', icon: '🏡' }
};

export const SOIL_TYPE_LABELS: Record<SoilType, { label: string; description: string; badgeColor: string }> = {
  all_purpose: {
    label: 'אדמת שתילה אוניברסלית',
    description: 'מצע מאוזן עם סיבי קוקוס, כבול ודישון איטי, מתאים לרוב צמחי הבית.',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
  },
  airy_aroid: {
    label: 'תערובת מאווררת (ארואידים)',
    description: 'תערובת אוורירית עם פרלייט, קליפות אורן (בארק) וסיבי קוקוס למניעת ריקבון שורשים.',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
  },
  cactus_succulent: {
    label: 'מצע מנוקז לקקטוסים וסוקולנטים',
    description: 'מצע דל בחומר אורגני ועשיר בחול, טוף ופרלייט לניקוז מהיר מאוד של מים.',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300'
  },
  peat_rich: {
    label: 'מצע עשיר ושומר לחות',
    description: 'אדמה עשירה בכבול והומוס השומרת על לחות אחידה לצמחים אוהבי מים.',
    badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
  },
  orchid_bark: {
    label: 'מצע קליפות אורן (סחלבים)',
    description: 'שבבי עץ וקליפות אורן המאפשרים זרימת אוויר חופשית לשורשים אוויריים.',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
  }
};

export const SUNLIGHT_LABELS: Record<SunlightLevel, { label: string; description: string; icon: string }> = {
  direct_sun: {
    label: 'שמש ישירה',
    description: 'חלון דרומי/מערבי או מרפסת שמש עם לפחות 4 שעות קרינה ישירה.',
    icon: '☀️'
  },
  bright_indirect: {
    label: 'אור מלא (ללא שמש ישירה)',
    description: 'קרוב לחלון מואר או מאחורי וילון דק, ללא קרני שמש ישירות ששורפות עלים.',
    icon: '🌤️'
  },
  medium_light: {
    label: 'חצי צל / אור בינוני',
    description: 'מרחק של 2-3 מטרים מחלון מואר, תאורה נעימה לאורך היום.',
    icon: '⛅'
  },
  low_light: {
    label: 'צל / מעט אור',
    description: 'פינות פנימיות בבית או חדרים עם חלון קטן ותאורה מלאכותית.',
    icon: '🌥️'
  }
};

export const HUMIDITY_LABELS: Record<HumidityLevel, { label: string; description: string }> = {
  high: { label: 'לחות גבוהה (60%+)', description: 'אוהב ריסוס מים על העלים או מיקום ליד מכשיר אדים / חדר רחצה מואר' },
  medium: { label: 'לחות ביתית רגילה (40-60%)', description: 'מסתדר מצוין עם הלחות הממוצעת בדירה בישראל' },
  low: { label: 'עמיד ליובש (עד 40%)', description: 'עמיד לאוויר יבש ולמזגנים, אין צורך בריסוס עלים' }
};

export const HEALTH_STATUS_META: Record<
  PlantHealthStatus,
  { label: string; badgeClass: string; dotClass: string; icon: string }
> = {
  thriving: {
    label: 'משגשג ומלבלב',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/50',
    dotClass: 'bg-emerald-500',
    icon: '✨'
  },
  healthy: {
    label: 'בריא ויציב',
    badgeClass: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/70 dark:text-green-300 dark:border-green-800/50',
    dotClass: 'bg-green-500',
    icon: '🌿'
  },
  needs_attention: {
    label: 'דורש תשומת לב',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/50',
    dotClass: 'bg-amber-500',
    icon: '⚠️'
  },
  critical: {
    label: 'במצוקה - טיפול דחוף',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800/50',
    dotClass: 'bg-rose-500',
    icon: '🚨'
  }
};

export interface PlantPreset {
  name: string;
  species: string;
  imageUrl: string;
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
  careRecommendations: string[];
}

export const PLANT_PRESETS: PlantPreset[] = [
  {
    name: 'מונסטרה דליציוזה',
    species: 'Monstera deliciosa',
    imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80',
    wateringFrequencyDays: 7,
    waterAmountMl: 350,
    wateringTips: 'להשקות רק כאשר 3-4 הס"מ העליונים של האדמה יבשים למגע. לרוקן מים עודפים מהתחתית.',
    soilType: 'airy_aroid',
    soilDescription: 'תערובת מאווררת עם פרלייט, קליפות אורן ואדמת עציצים לניקוז מעולה.',
    sunlight: 'bright_indirect',
    humidity: 'high',
    temperatureRange: '18°C - 29°C',
    fertilizeFrequencyDays: 30,
    mistFrequencyDays: 4,
    isPetSafe: false,
    careRecommendations: [
      'נגבו אבק מהעלים הגדולים עם מטלית לחה פעם בשבועיים כדי לשפר פוטוסינתזה',
      'מומלץ להוסיף מוט קוקוס לתמיכה בשורשים האוויריים ובצמיחה אנכית',
      'הימנעו מרוח ישירה של מזגן שעלולה לייבש את קצוות העלים'
    ]
  },
  {
    name: 'סנסיווריה (לשון החותנת)',
    species: 'Dracaena trifasciata',
    imageUrl: 'https://images.unsplash.com/photo-1593482892290-f54927ae1bb6?auto=format&fit=crop&w=800&q=80',
    wateringFrequencyDays: 14,
    waterAmountMl: 180,
    wateringTips: 'להשקות רק כשהאדמה יבשה לחלוטין עד תחתית העציץ. בחורף אפשר להשקות פעם ב-3 שבועות.',
    soilType: 'cactus_succulent',
    soilDescription: 'אדמה מנוקזת היטב עם תוספת פרלייט או חול גס למניעת ריקבון.',
    sunlight: 'medium_light',
    humidity: 'low',
    temperatureRange: '15°C - 32°C',
    fertilizeFrequencyDays: 60,
    mistFrequencyDays: 0,
    isPetSafe: false,
    careRecommendations: [
      'הסכנה העיקרית לצמח היא עודף מים - אם אתם מתלבטים אם להשקות, חכו עוד יומיים',
      'אל תשפכו מים לתוך מרכז שושנת העלים כדי למנוע ריקבון צוואר השורש',
      'מטהר אוויר מעולה שמתאים מאוד גם לחדרי שינה ולפינות מוצלות יחסית'
    ]
  },
  {
    name: 'פותוס זהוב',
    species: 'Epipremnum aureum',
    imageUrl: 'https://images.unsplash.com/photo-1598880940371-c756e015fea1?auto=format&fit=crop&w=800&q=80',
    wateringFrequencyDays: 6,
    waterAmountMl: 250,
    wateringTips: 'להשקות כשחלקה העליון של האדמה מתייבש. אם העלים מעט נפולים, הוא מאותת שהוא צמא.',
    soilType: 'all_purpose',
    soilDescription: 'אדמת שתילה אוניברסלית איכותית עם חורי ניקוז בעציץ.',
    sunlight: 'bright_indirect',
    humidity: 'medium',
    temperatureRange: '17°C - 30°C',
    fertilizeFrequencyDays: 30,
    mistFrequencyDays: 7,
    isPetSafe: false,
    careRecommendations: [
      'ככל שהפותוס יקבל יותר אור (ללא שמש ישירה), הגוונים הצהובים-לבנים בעלים יהיו בולטים יותר',
      'גיזום קצוות ארוכים מעודד צמיחה צפופה ומלאה יותר בחלק העליון של העציץ',
      'ניתן להשריש בקלות ייחורים בכוס מים ולהוסיף לעציץ או ליצור צמחים חדשים לבית'
    ]
  },
  {
    name: 'פיקוס כינורי',
    species: 'Ficus lyrata',
    imageUrl: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=800&q=80',
    wateringFrequencyDays: 8,
    waterAmountMl: 400,
    wateringTips: 'אוהב שגרה קבועה: השקו עד שמים יוצאים מחורי הניקוז רק לאחר ש-5 ס"מ עליונים התייבשו.',
    soilType: 'airy_aroid',
    soilDescription: 'מצע עשיר אך מנוקז היטב עם 25% פרלייט וקליפות אורן.',
    sunlight: 'bright_indirect',
    humidity: 'high',
    temperatureRange: '18°C - 27°C',
    fertilizeFrequencyDays: 30,
    mistFrequencyDays: 4,
    isPetSafe: false,
    careRecommendations: [
      'הפיקוס הכינורי שונא שינויי מיקום ורוחות פרצים - בחרו לו פינה מוארת וקבועה בסלון',
      'סובבו את העציץ ב-90 מעלות פעם בחודש כדי שיצמח ישר ולא יטה לכיוון החלון',
      'כתמים חומים בקצוות מעידים על יובש או חוסר מים; כתמים כהים במרכז העלה מעידים לרוב על עודף השקיה'
    ]
  },
  {
    name: 'ספטיפיליום (שושן השלום)',
    species: 'Spathiphyllum wallisii',
    imageUrl: 'https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?auto=format&fit=crop&w=800&q=80',
    wateringFrequencyDays: 5,
    waterAmountMl: 300,
    wateringTips: 'אוהב אדמה לחה קלות (אך לא בוצית). מעדיף מים מסוננים או מים שעמדו כמה שעות.',
    soilType: 'peat_rich',
    soilDescription: 'אדמת עציצים עשירה בכבול השומרת על לחות נעימה סביב השורשים.',
    sunlight: 'medium_light',
    humidity: 'high',
    temperatureRange: '18°C - 26°C',
    fertilizeFrequencyDays: 30,
    mistFrequencyDays: 3,
    isPetSafe: false,
    careRecommendations: [
      'רגיש לכלור ולמלחים במי ברז - השקיה במים מסוננים תמנע קצוות עלים שרופים וחומים',
      'לעודד פריחה לבנה מרשימה, מקמו אותו בחדר מואר היטב ללא שמש ישירה',
      'גזמו פרחים שהתייבשו או הפכו לירוקים-חומים קרוב לבסיס הגבעול'
    ]
  },
  {
    name: 'קלתאה אורביפוליה',
    species: 'Calathea orbifolia',
    imageUrl: 'https://images.unsplash.com/photo-1612363148951-15f16817648f?auto=format&fit=crop&w=800&q=80',
    wateringFrequencyDays: 5,
    waterAmountMl: 250,
    wateringTips: 'שמרו על מצע לח באופן אחיד והשקו במים מסוננים בטמפרטורת החדר.',
    soilType: 'peat_rich',
    soilDescription: 'תערובת שומרת לחות אך מאווררת (כבול, קוקוס ופרלייט).',
    sunlight: 'medium_light',
    humidity: 'high',
    temperatureRange: '18°C - 26°C',
    fertilizeFrequencyDays: 30,
    mistFrequencyDays: 2,
    isPetSafe: true,
    careRecommendations: [
      'בטוחה לחלוטין לחתולים וכלבים בבית! 🐾',
      'חובבת לחות גבוהה - ריסוס עדין או הנחה על מגש טוף רטוב ישמרו על שולי העלים ירוקים ויפים',
      'שמש ישירה תגרום לדהיית הפסים הכסופים על העלים'
    ]
  }
];

const daysAgoISO = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

export const INITIAL_MEMBERS: HouseholdMember[] = [
  { id: 'mem_1', name: 'דניאל', avatar: '🌿', color: '#16a34a' },
  { id: 'mem_2', name: 'שותף/ה לבית', avatar: '💧', color: '#0284c7' }
];

export const INITIAL_PLANTS: Plant[] = [
  {
    id: 'plant_monstera_1',
    name: 'מונסטרה דליציוזה',
    nickname: 'המונסטרה ליד הטלוויזיה',
    species: 'Monstera deliciosa',
    room: 'living_room',
    imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80',
    wateringFrequencyDays: 7,
    waterAmountMl: 350,
    wateringTips: 'להשקות כש-3 הס"מ העליונים של האדמה יבשים למגע. לרוקן עודפים מהתחתית.',
    lastWateredAt: daysAgoISO(7), // Due today!
    lastWateredBy: 'דניאל',
    fertilizeFrequencyDays: 30,
    lastFertilizedAt: daysAgoISO(18),
    mistFrequencyDays: 4,
    lastMistedAt: daysAgoISO(4),
    soilType: 'airy_aroid',
    soilDescription: 'תערובת מאווררת עם פרלייט וקליפות אורן (ניקוז גבוה)',
    hasDrainageHole: true,
    sunlight: 'bright_indirect',
    humidity: 'high',
    temperatureRange: '18°C - 29°C',
    isPetSafe: false,
    healthStatus: 'thriving',
    healthScore: 94,
    currentIssues: [],
    careRecommendations: [
      'נגבו אבק מהעלים הגדולים עם מטלית לחה פעם בשבועיים כדי לעודד פתיחת עלים מפורצים חדשים',
      'מומלץ להרחיק מרוח ישירה של מזגן הסלון',
      'השקו עד ליציאת מעט מים מחורי הניקוז ורוקנו את הצלחת לאחר 10 דקות'
    ],
    diagnosisHistory: [],
    notes: 'הוציאה עלה חדש עם חורים השבוע!',
    createdAt: Date.now() - 86400000 * 14
  },
  {
    id: 'plant_spath_2',
    name: 'ספטיפיליום (שושן השלום)',
    nickname: 'שושן בפינת אוכל',
    species: 'Spathiphyllum wallisii',
    room: 'kitchen',
    imageUrl: 'https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?auto=format&fit=crop&w=800&q=80',
    wateringFrequencyDays: 5,
    waterAmountMl: 300,
    wateringTips: 'אוהב אדמה לחה קלות ומים מסוננים מהתמי4/בריטה למניעת מלחים.',
    lastWateredAt: daysAgoISO(6), // Overdue by 1 day!
    lastWateredBy: 'שותף/ה לבית',
    fertilizeFrequencyDays: 30,
    lastFertilizedAt: daysAgoISO(32),
    mistFrequencyDays: 3,
    lastMistedAt: daysAgoISO(2),
    soilType: 'peat_rich',
    soilDescription: 'אדמת שתילה עשירה בכבול השומרת על לחות',
    hasDrainageHole: true,
    sunlight: 'medium_light',
    humidity: 'high',
    temperatureRange: '18°C - 26°C',
    isPetSafe: false,
    healthStatus: 'needs_attention',
    healthScore: 76,
    currentIssues: ['קצוות עלים מעט חומים בגלל יובש באוויר ואיחור קל בהשקיה'],
    careRecommendations: [
      'עברו להשקיה במים מסוננים במקום מי ברז ישירים כדי למנוע צריבת מלחים בקצוות',
      'העלים מעט נפולים כרגע - השקיה טובה היום תחזיר אותם לזקיפות תוך 4 שעות',
      'מומלץ לרסס מעט מים על העלים פעמיים בשבוע'
    ],
    diagnosisHistory: [],
    notes: 'רגיש לחום מהתנור, להקפיד על השקיה בזמן.',
    createdAt: Date.now() - 86400000 * 10
  },
  {
    id: 'plant_snake_3',
    name: 'סנסיווריה (לשון החותנת)',
    nickname: 'השומר בחדר שינה',
    species: 'Dracaena trifasciata',
    room: 'bedroom',
    imageUrl: 'https://images.unsplash.com/photo-1593482892290-f54927ae1bb6?auto=format&fit=crop&w=800&q=80',
    wateringFrequencyDays: 14,
    waterAmountMl: 180,
    wateringTips: 'להשקות רק כשהמצע יבש לגמרי עד העומק. לא להשקות לתוך מרכז העלים.',
    lastWateredAt: daysAgoISO(4), // 10 days left
    lastWateredBy: 'דניאל',
    fertilizeFrequencyDays: 60,
    lastFertilizedAt: daysAgoISO(20),
    mistFrequencyDays: 0,
    soilType: 'cactus_succulent',
    soilDescription: 'מצע מנוקז לקקטוסים וסוקולנטים עם פרלייט',
    hasDrainageHole: true,
    sunlight: 'low_light',
    humidity: 'low',
    temperatureRange: '15°C - 32°C',
    isPetSafe: false,
    healthStatus: 'healthy',
    healthScore: 98,
    currentIssues: [],
    careRecommendations: [
      'הצמח במצב מעולה! הקפידו לא להשקות לפני שהאדמה יבשה לחלוטין',
      'מתאים מאוד לחדר השינה מכיוון שהוא משחרר חמצן גם בשעות הלילה'
    ],
    diagnosisHistory: [],
    notes: 'עמיד מאוד, כמעט אפס תחזוקה.',
    createdAt: Date.now() - 86400000 * 25
  }
];

export const INITIAL_CARE_LOGS: PlantCareLog[] = [
  {
    id: 'log_init_1',
    plantId: 'plant_snake_3',
    plantName: 'סנסיווריה (לשון החותנת)',
    action: 'watered',
    performedBy: 'דניאל',
    timestamp: Date.now() - 86400000 * 4,
    notes: 'השקיה קלה של 180 מ"ל לאחר ייבוש מלא'
  },
  {
    id: 'log_init_2',
    plantId: 'plant_spath_2',
    plantName: 'ספטיפיליום (שושן השלום)',
    action: 'watered',
    performedBy: 'שותף/ה לבית',
    timestamp: Date.now() - 86400000 * 6,
    notes: 'השקיה במים מסוננים'
  },
  {
    id: 'log_init_3',
    plantId: 'plant_monstera_1',
    plantName: 'מונסטרה דליציוזה',
    action: 'watered',
    performedBy: 'דניאל',
    timestamp: Date.now() - 86400000 * 7,
    notes: 'השקיה מלאה + ניגוב עלים'
  }
];
