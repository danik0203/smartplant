import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Plant, PlantCareLog, HouseholdMember, GoogleUserProfile } from '../types';
import { INITIAL_PLANTS, INITIAL_CARE_LOGS, INITIAL_MEMBERS } from './mockPlants';

export const DEFAULT_SUPABASE_URL = 'https://vcagwdvpricjdgdfczlw.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_c3bICdt5jqJirdRHhjnLgQ_QoFSrxlP';

const ENV_SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const ENV_SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const STORAGE_KEYS = {
  SUPABASE_URL: 'plants_care_supabase_url',
  SUPABASE_ANON_KEY: 'plants_care_supabase_anon_key',
  PLANTS_CACHE: 'plants_care_plants_cache_v1',
  LOGS_CACHE: 'plants_care_logs_cache_v1',
  MEMBERS_CACHE: 'plants_care_members_cache_v1',
  CURRENT_MEMBER_ID: 'plants_care_current_member_id',
  GOOGLE_USER: 'plants_care_google_user'
};

export class PlantSupabaseService {
  private client: SupabaseClient | null = null;
  private url: string = DEFAULT_SUPABASE_URL;
  private key: string = DEFAULT_SUPABASE_KEY;
  private remoteTablesReady: boolean = false;

  constructor() {
    this.url = this.getUrl();
    this.key = this.getKey();
    try {
      localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, this.url);
      localStorage.setItem(STORAGE_KEYS.SUPABASE_ANON_KEY, this.key);
    } catch {}
    this.initClient();
    this.checkInviteUrlParams();
  }

  public getUrl(): string {
    if (ENV_SUPABASE_URL && ENV_SUPABASE_URL.startsWith('https://')) {
      return ENV_SUPABASE_URL;
    }
    const fromStorage = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) : null;
    if (fromStorage && fromStorage.startsWith('https://')) {
      return fromStorage;
    }
    return DEFAULT_SUPABASE_URL;
  }

  public getKey(): string {
    if (ENV_SUPABASE_ANON_KEY && ENV_SUPABASE_ANON_KEY.length > 5) {
      return ENV_SUPABASE_ANON_KEY;
    }
    const fromStorage = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.SUPABASE_ANON_KEY) : null;
    if (fromStorage && fromStorage.length > 5) {
      return fromStorage;
    }
    return DEFAULT_SUPABASE_KEY;
  }

  public initClient() {
    const activeUrl = this.getUrl();
    const activeKey = this.getKey();

    if (activeUrl && activeKey && activeUrl.startsWith('https://')) {
      try {
        this.client = createClient(activeUrl, activeKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        });
      } catch (e) {
        console.error('Failed to init Supabase client', e);
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  private checkInviteUrlParams() {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const configParam = urlParams.get('supabase');
      if (configParam) {
        const decoded = JSON.parse(atob(configParam));
        if (decoded.url && decoded.key) {
          this.setCredentials(decoded.url, decoded.key);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch {}
  }

  public setCredentials(url: string, key: string) {
    this.url = url.trim() || DEFAULT_SUPABASE_URL;
    this.key = key.trim() || DEFAULT_SUPABASE_KEY;
    localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, this.url);
    localStorage.setItem(STORAGE_KEYS.SUPABASE_ANON_KEY, this.key);
    this.initClient();
  }

  public getCredentials(): { url: string; key: string } {
    return { url: this.getUrl(), key: this.getKey() };
  }

  public getInviteLink(): string {
    const activeUrl = this.getUrl();
    const activeKey = this.getKey();
    const base = window.location.origin + window.location.pathname;
    const payload = JSON.stringify({ url: activeUrl, key: activeKey });
    return `${base}?supabase=${btoa(payload)}`;
  }

  public isConnected(): boolean {
    if (!this.client) this.initClient();
    return !!this.client;
  }

  public isRemoteTablesReady(): boolean {
    return this.remoteTablesReady;
  }

  // --- Google Auth ---
  public async signInWithGoogle(): Promise<{ error: any }> {
    if (!this.client) this.initClient();
    if (!this.client) return { error: new Error('Supabase client not initialized') };

    try {
      const redirectTarget = window.location.origin + window.location.pathname;
      const { error } = await this.client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectTarget }
      });
      return { error };
    } catch (e: any) {
      return { error: e };
    }
  }

  public async signOut(): Promise<void> {
    if (this.client) {
      try {
        await this.client.auth.signOut({ scope: 'local' });
      } catch {}
    }
    localStorage.removeItem(STORAGE_KEYS.GOOGLE_USER);
  }

  public onAuthStateChange(callback: (user: GoogleUserProfile | null) => void) {
    if (!this.client) this.initClient();
    if (!this.client) return () => {};

    this.client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const profile = this.formatSupabaseUser(session.user);
        localStorage.setItem(STORAGE_KEYS.GOOGLE_USER, JSON.stringify(profile));
        callback(profile);
      } else {
        const cached = localStorage.getItem(STORAGE_KEYS.GOOGLE_USER);
        callback(cached ? JSON.parse(cached) : null);
      }
    });

    const {
      data: { subscription }
    } = this.client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        localStorage.removeItem(STORAGE_KEYS.GOOGLE_USER);
        callback(null);
      } else if (session?.user) {
        const profile = this.formatSupabaseUser(session.user);
        localStorage.setItem(STORAGE_KEYS.GOOGLE_USER, JSON.stringify(profile));
        callback(profile);
      }
    });

    return () => subscription.unsubscribe();
  }

  private formatSupabaseUser(user: User): GoogleUserProfile {
    const meta = user.user_metadata || {};
    return {
      email: user.email || meta.email || '',
      name: meta.full_name || meta.name || user.email?.split('@')[0] || 'משתמש',
      picture: meta.avatar_url || meta.picture || '',
      sub: user.id
    };
  }

  // --- Realtime Subscription ---
  public subscribeToRealtimeUpdates(onUpdate: () => void) {
    if (!this.client) this.initClient();
    if (!this.client) return () => {};

    const channel = this.client
      .channel('plants-care-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plants' }, () => onUpdate())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plant_care_logs' }, () => onUpdate())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plant_members' }, () => onUpdate())
      .subscribe();

    return () => {
      if (this.client) {
        this.client.removeChannel(channel);
      }
    };
  }

  public async testConnection(): Promise<{ success: boolean; message: string; tablesExist: boolean }> {
    if (!this.client) this.initClient();
    if (!this.client) {
      return { success: false, message: 'חיבור Supabase לא מוגדר', tablesExist: false };
    }

    try {
      const { error } = await this.client.from('plants').select('id', { count: 'exact', head: true });
      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist') || error.code === 'PGRST205') {
          this.remoteTablesReady = false;
          return {
            success: true,
            tablesExist: false,
            message: 'מחובר ל-Supabase! לסנכרון מלא בענן בין מכשירים, הרץ פעם אחת את קוד ה-SQL שבהגדרות.'
          };
        }
        return { success: false, tablesExist: false, message: `שגיאה: ${error.message}` };
      }

      this.remoteTablesReady = true;
      return {
        success: true,
        tablesExist: true,
        message: 'מחובר ומסונכרן בלייב עם Supabase בין כל המכשירים בבית! 🌿✨'
      };
    } catch (err: any) {
      return { success: false, tablesExist: false, message: `שגיאת רשת: ${err.message}` };
    }
  }

  // --- Map Row <-> Plant ---
  private rowToPlant(row: any): Plant {
    return {
      id: row.id,
      name: row.name,
      nickname: row.nickname || '',
      species: row.species || '',
      room: row.room || 'living_room',
      imageUrl: row.image_url || '',
      wateringFrequencyDays: Number(row.watering_frequency_days) || 7,
      waterAmountMl: Number(row.water_amount_ml) || 250,
      wateringTips: row.watering_tips || '',
      lastWateredAt: row.last_watered_at || new Date().toISOString(),
      lastWateredBy: row.last_watered_by || 'אני',
      snoozedUntil: row.snoozed_until || undefined,
      fertilizeFrequencyDays: Number(row.fertilize_frequency_days) || 30,
      lastFertilizedAt: row.last_fertilized_at || undefined,
      mistFrequencyDays: Number(row.mist_frequency_days) || 0,
      lastMistedAt: row.last_misted_at || undefined,
      soilType: row.soil_type || 'all_purpose',
      soilDescription: row.soil_description || '',
      hasDrainageHole: row.has_drainage_hole !== false,
      sunlight: row.sunlight || 'bright_indirect',
      humidity: row.humidity || 'medium',
      temperatureRange: row.temperature_range || '18°C - 28°C',
      isPetSafe: Boolean(row.is_pet_safe),
      healthStatus: row.health_status || 'healthy',
      healthScore: Number(row.health_score) || 90,
      currentIssues: Array.isArray(row.current_issues) ? row.current_issues : [],
      careRecommendations: Array.isArray(row.care_recommendations) ? row.care_recommendations : [],
      diagnosisHistory: Array.isArray(row.diagnosis_history) ? row.diagnosis_history : [],
      notes: row.notes || '',
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
    };
  }

  private plantToRow(plant: Plant) {
    return {
      id: plant.id,
      name: plant.name,
      nickname: plant.nickname || '',
      species: plant.species || '',
      room: plant.room,
      image_url: plant.imageUrl || '',
      watering_frequency_days: plant.wateringFrequencyDays,
      water_amount_ml: plant.waterAmountMl,
      watering_tips: plant.wateringTips || '',
      last_watered_at: plant.lastWateredAt,
      last_watered_by: plant.lastWateredBy || 'אני',
      snoozed_until: plant.snoozedUntil || '',
      fertilize_frequency_days: plant.fertilizeFrequencyDays || 30,
      last_fertilized_at: plant.lastFertilizedAt || '',
      mist_frequency_days: plant.mistFrequencyDays || 0,
      last_misted_at: plant.lastMistedAt || '',
      soil_type: plant.soilType,
      soil_description: plant.soilDescription || '',
      has_drainage_hole: plant.hasDrainageHole,
      sunlight: plant.sunlight,
      humidity: plant.humidity,
      temperature_range: plant.temperatureRange || '18°C - 28°C',
      is_pet_safe: plant.isPetSafe,
      health_status: plant.healthStatus,
      health_score: plant.healthScore,
      current_issues: plant.currentIssues || [],
      care_recommendations: plant.careRecommendations || [],
      diagnosis_history: plant.diagnosisHistory || [],
      notes: plant.notes || ''
    };
  }

  public getLocalPlants(): Plant[] {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.PLANTS_CACHE);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    localStorage.setItem(STORAGE_KEYS.PLANTS_CACHE, JSON.stringify(INITIAL_PLANTS));
    return INITIAL_PLANTS;
  }

  public getLocalLogs(): PlantCareLog[] {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.LOGS_CACHE);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    localStorage.setItem(STORAGE_KEYS.LOGS_CACHE, JSON.stringify(INITIAL_CARE_LOGS));
    return INITIAL_CARE_LOGS;
  }

  public getLocalMembers(): HouseholdMember[] {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.MEMBERS_CACHE);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    localStorage.setItem(STORAGE_KEYS.MEMBERS_CACHE, JSON.stringify(INITIAL_MEMBERS));
    return INITIAL_MEMBERS;
  }

  public async loadAllData(): Promise<{
    plants: Plant[];
    logs: PlantCareLog[];
    members: HouseholdMember[];
    source: 'remote' | 'local';
  }> {
    if (!this.client) this.initClient();

    if (this.client) {
      try {
        const [plantsRes, logsRes, membersRes] = await Promise.all([
          this.client.from('plants').select('*').order('created_at', { ascending: false }),
          this.client.from('plant_care_logs').select('*').order('created_at', { ascending: false }).limit(100),
          this.client.from('plant_members').select('*')
        ]);

        if (!plantsRes.error) {
          this.remoteTablesReady = true;
          let remotePlants = (plantsRes.data || []).map((r: any) => this.rowToPlant(r));
          let remoteLogs: PlantCareLog[] = (logsRes.data || []).map((r: any) => ({
            id: r.id,
            plantId: r.plant_id,
            plantName: r.plant_name,
            action: r.action,
            performedBy: r.performed_by,
            timestamp: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
            notes: r.notes || ''
          }));
          let remoteMembers: HouseholdMember[] = (membersRes.data || []).map((r: any) => ({
            id: r.id,
            name: r.name,
            avatar: r.avatar || '🌿',
            color: r.color || '#16a34a',
            phone: r.phone || '',
            googleEmail: r.google_email || '',
            picture: r.picture || ''
          }));

          // Seed initial plants to remote if table is completely empty on first launch
          if (remotePlants.length === 0) {
            const localPlants = this.getLocalPlants();
            remotePlants = localPlants;
            for (const p of localPlants) {
              await this.client.from('plants').upsert(this.plantToRow(p));
            }
          }

          if (remoteMembers.length === 0) {
            const localMembers = this.getLocalMembers();
            remoteMembers = localMembers;
            for (const m of localMembers) {
              await this.client.from('plant_members').upsert({
                id: m.id,
                name: m.name,
                avatar: m.avatar,
                color: m.color,
                phone: m.phone || '',
                google_email: m.googleEmail || '',
                picture: m.picture || ''
              });
            }
          }

          localStorage.setItem(STORAGE_KEYS.PLANTS_CACHE, JSON.stringify(remotePlants));
          localStorage.setItem(STORAGE_KEYS.LOGS_CACHE, JSON.stringify(remoteLogs));
          localStorage.setItem(STORAGE_KEYS.MEMBERS_CACHE, JSON.stringify(remoteMembers));

          return {
            plants: remotePlants,
            logs: remoteLogs,
            members: remoteMembers,
            source: 'remote'
          };
        } else {
          this.remoteTablesReady = false;
        }
      } catch (e) {
        console.warn('Supabase plants tables not yet created or offline, using local storage cache', e);
      }
    }

    return {
      plants: this.getLocalPlants(),
      logs: this.getLocalLogs(),
      members: this.getLocalMembers(),
      source: 'local'
    };
  }

  public async upsertPlant(plant: Plant): Promise<void> {
    const current = this.getLocalPlants();
    const exists = current.some((p) => p.id === plant.id);
    const updated = exists ? current.map((p) => (p.id === plant.id ? plant : p)) : [plant, ...current];
    localStorage.setItem(STORAGE_KEYS.PLANTS_CACHE, JSON.stringify(updated));

    if (this.client && this.remoteTablesReady) {
      try {
        await this.client.from('plants').upsert(this.plantToRow(plant));
      } catch (e) {
        console.error('Failed to upsert plant to Supabase', e);
      }
    }
  }

  public async deletePlant(plantId: string): Promise<void> {
    const current = this.getLocalPlants().filter((p) => p.id !== plantId);
    localStorage.setItem(STORAGE_KEYS.PLANTS_CACHE, JSON.stringify(current));

    if (this.client && this.remoteTablesReady) {
      try {
        await this.client.from('plants').delete().eq('id', plantId);
      } catch (e) {
        console.error('Failed to delete plant from Supabase', e);
      }
    }
  }

  public async addCareLog(log: PlantCareLog): Promise<void> {
    const current = this.getLocalLogs();
    const updated = [log, ...current].slice(0, 150);
    localStorage.setItem(STORAGE_KEYS.LOGS_CACHE, JSON.stringify(updated));

    if (this.client && this.remoteTablesReady) {
      try {
        await this.client.from('plant_care_logs').insert({
          id: log.id,
          plant_id: log.plantId,
          plant_name: log.plantName,
          action: log.action,
          performed_by: log.performedBy,
          notes: log.notes || ''
        });
      } catch (e) {
        console.error('Failed to insert care log to Supabase', e);
      }
    }
  }

  public async saveMembers(members: HouseholdMember[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.MEMBERS_CACHE, JSON.stringify(members));

    if (this.client && this.remoteTablesReady) {
      try {
        for (const m of members) {
          await this.client.from('plant_members').upsert({
            id: m.id,
            name: m.name,
            avatar: m.avatar,
            color: m.color,
            phone: m.phone || '',
            google_email: m.googleEmail || '',
            picture: m.picture || ''
          });
        }
      } catch (e) {
        console.error('Failed to sync members to Supabase', e);
      }
    }
  }
}

export const plantSupabase = new PlantSupabaseService();
