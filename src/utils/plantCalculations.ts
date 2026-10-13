import { Plant } from '../types';
import { ROOM_LABELS } from '../services/mockPlants';

export type WateringUrgency = 'overdue' | 'due_today' | 'upcoming' | 'snoozed' | 'ok';

export interface PlantWateringStatus {
  daysSinceWatered: number;
  daysUntilNext: number;
  urgency: WateringUrgency;
  statusLabel: string;
  moisturePercent: number;
  isMistingDue: boolean;
  isFertilizingDue: boolean;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function getStartOfDay(date: Date = new Date()): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function getPlantWateringStatus(plant: Plant): PlantWateringStatus {
  const todayStart = getStartOfDay();
  const lastWateredTime = plant.lastWateredAt ? getStartOfDay(new Date(plant.lastWateredAt)) : todayStart;
  const daysSinceWatered = Math.max(0, Math.round((todayStart - lastWateredTime) / MS_PER_DAY));

  const freq = Math.max(1, plant.wateringFrequencyDays || 7);
  let daysUntilNext = freq - daysSinceWatered;

  // Check if snoozed ("האדמה עדיין לחה - דחה ביומיים")
  let isSnoozedActive = false;
  if (plant.snoozedUntil) {
    const snoozeTarget = getStartOfDay(new Date(plant.snoozedUntil));
    const snoozeDaysLeft = Math.round((snoozeTarget - todayStart) / MS_PER_DAY);
    if (snoozeDaysLeft > 0) {
      isSnoozedActive = true;
      daysUntilNext = Math.max(daysUntilNext, snoozeDaysLeft);
    }
  }

  let urgency: WateringUrgency = 'ok';
  let statusLabel = '';

  if (isSnoozedActive) {
    urgency = 'snoozed';
    statusLabel = `נדחה (אדמה לחה) • עוד ${daysUntilNext} ימים`;
  } else if (daysUntilNext < 0) {
    urgency = 'overdue';
    const overdueDays = Math.abs(daysUntilNext);
    statusLabel = overdueDays === 1 ? 'באיחור של יום אחד!' : `באיחור של ${overdueDays} ימים!`;
  } else if (daysUntilNext === 0) {
    urgency = 'due_today';
    statusLabel = 'צריך להשקות היום 💧';
  } else if (daysUntilNext <= 2) {
    urgency = 'upcoming';
    statusLabel = daysUntilNext === 1 ? 'השקיה מחר' : `השקיה בעוד יומיים`;
  } else {
    urgency = 'ok';
    statusLabel = `השקיה בעוד ${daysUntilNext} ימים`;
  }

  // Simulated soil moisture estimation based on watering cycle
  const rawMoisture = Math.round(Math.max(8, Math.min(100, ((freq - daysSinceWatered) / freq) * 100)));
  const moisturePercent = isSnoozedActive ? Math.max(rawMoisture, 45) : rawMoisture;

  // Check misting
  let isMistingDue = false;
  if (plant.mistFrequencyDays && plant.mistFrequencyDays > 0) {
    if (!plant.lastMistedAt) {
      isMistingDue = true;
    } else {
      const daysSinceMist = Math.round((todayStart - getStartOfDay(new Date(plant.lastMistedAt))) / MS_PER_DAY);
      isMistingDue = daysSinceMist >= plant.mistFrequencyDays;
    }
  }

  // Check fertilizing
  let isFertilizingDue = false;
  if (plant.fertilizeFrequencyDays && plant.fertilizeFrequencyDays > 0) {
    if (!plant.lastFertilizedAt) {
      isFertilizingDue = false;
    } else {
      const daysSinceFert = Math.round((todayStart - getStartOfDay(new Date(plant.lastFertilizedAt))) / MS_PER_DAY);
      isFertilizingDue = daysSinceFert >= plant.fertilizeFrequencyDays;
    }
  }

  return {
    daysSinceWatered,
    daysUntilNext,
    urgency,
    statusLabel,
    moisturePercent,
    isMistingDue,
    isFertilizingDue
  };
}

export function getSeasonalCareTip(): { seasonName: string; icon: string; tip: string } {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 6 && month <= 9) {
    return {
      seasonName: 'קיץ ישראלי חם',
      icon: '☀️',
      tip: 'בימי הקיץ החמים המזגנים מייבשים את האוויר בבית. בדקו את לחות הקרקע עם האצבע יום לפני מועד ההשקיה והקפידו על ריסוס לצמחים טרופיים.'
    };
  }
  if (month >= 12 || month <= 2) {
    return {
      seasonName: 'עונת החורף',
      icon: '🌧️',
      tip: 'בחורף קצב התאדות המים איטי יותר והצמחים במנוחה. תמיד ודאו שהשכבה העליונה באדמה התייבשה לפני השקיה כדי למנוע ריקבון שורשים.'
    };
  }
  return {
    seasonName: 'עונת מעבר אידיאלית',
    icon: '🌱',
    tip: 'עונות המעבר הן זמן הצמיחה הטוב ביותר לצמחי בית! זה הזמן המושלם לדשן קלות ולנקות אבק מהעלים.'
  };
}

export function buildWhatsAppWateringReminder(plantsNeedingWater: Plant[], senderName: string): string {
  if (plantsNeedingWater.length === 0) {
    return `היי! 🌿 רק מעדכן/ת שכל הצמחים שלנו בבית הושקו ורוויים היום 💧✨ (${senderName})`;
  }

  const lines = plantsNeedingWater.map((p) => {
    const roomName = ROOM_LABELS[p.room]?.label || 'בבית';
    const st = getPlantWateringStatus(p);
    return `• *${p.name}* (${roomName}) - כ-${p.waterAmountMl} מ"ל מים [${st.statusLabel}]`;
  });

  return [
    `היי! 🌿💧 *תזכורת מהמשתלה הביתית שלנו:*`,
    `יש לנו ${plantsNeedingWater.length === 1 ? 'צמח אחד שצמא' : `${plantsNeedingWater.length} צמחים שצמאים`} למים היום:`,
    '',
    ...lines,
    '',
    `מי שבבית ויכול להשקות - אל תשכחו לסמן *"השקיתי 💧"* באפליקציה כדי שנדע! 🙏🌱`
  ].join('\n');
}

export function formatRelativeDateHe(isoOrTimestamp: string | number): string {
  const date = typeof isoOrTimestamp === 'number' ? new Date(isoOrTimestamp) : new Date(isoOrTimestamp);
  const diffDays = Math.round((getStartOfDay() - getStartOfDay(date)) / MS_PER_DAY);
  if (diffDays <= 0) return 'היום';
  if (diffDays === 1) return 'אתמול';
  if (diffDays === 2) return 'לפני יומיים';
  return `לפני ${diffDays} ימים`;
}
