import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import {
  Plant,
  PlantCareLog,
  Household,
  HouseholdMember,
  GoogleUserProfile
} from '../types';
import {
  INITIAL_PLANTS,
  INITIAL_CARE_LOGS,
  INITIAL_MEMBERS,
  DEFAULT_HOUSEHOLD
} from './mockPlants';

export const DEFAULT_SUPABASE_URL = 'https://dxrzojnknssjhrgbjrju.supabase.co';
export const DEFAULT_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4cnpvam5rbnNzamhyZ2Jqcmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NzE5ODIsImV4cCI6MjEwNzQ0Nzk4Mn0.UQ2_NvxtMRM5V5lio-Q4tjIsstnt5Iil0Bn-lONb5RY';

const ENV_SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const ENV_SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const STORAGE_KEYS = {
  SUPABASE_URL: 'plants_care_supabase_url',
  SUPABASE_ANON_KEY: 'plants_care_supabase_anon_key',
  ACTIVE_HOUSEHOLD: 'plants_care_active_household_v2',
  HOUSEHOLDS_LIST: 'plants_care_households_list_v2',
  PLANTS_CACHE: 'plants_care_plants_cache_v2',
  LOGS_CACHE: 'plants_care_logs_cache_v2',
  MEMBERS_CACHE: 'plants_care_members_cache_v2',
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

  public isConnected(): boolean {
    if (!this.client) this.initClient();
    return !!this.client;
  }

  // ==========================================
  // --- Google Authentication ---
  // ==========================================
  public async signInWithGoogle(): Promise<{ error: any }> {
    if (!this.client) this.initClient();
    if (!this.client) return { error: new Error('חיבור Supabase לא מאותחל') };

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

  public getSavedGoogleUser(): GoogleUserProfile | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GOOGLE_USER);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
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
        const cached = this.getSavedGoogleUser();
        callback(cached);
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
      name: meta.full_name || meta.name || user.email?.split('@')[0] || 'שותף',
      picture: meta.avatar_url || meta.picture || '',
      sub: user.id
    };
  }

  // ==========================================
  // --- Households & Groups Management ---
  // ==========================================
  public getActiveHousehold(): Household {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_HOUSEHOLD);
      if (raw) return JSON.parse(raw);
    } catch {}
    localStorage.setItem(STORAGE_KEYS.ACTIVE_HOUSEHOLD, JSON.stringify(DEFAULT_HOUSEHOLD));
    return DEFAULT_HOUSEHOLD;
  }

  public setActiveHousehold(household: Household) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_HOUSEHOLD, JSON.stringify(household));
  }

  public getCachedHouseholds(): Household[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HOUSEHOLDS_LIST);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) return list;
      }
    } catch {}
    return [DEFAULT_HOUSEHOLD];
  }

  public setCachedHouseholds(list: Household[]) {
    localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS_LIST, JSON.stringify(list));
  }

  public generateInviteCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = 'PLANT-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public getHouseholdInviteLink(inviteCode: string): string {
    const base = window.location.origin + window.location.pathname;
    return `${base}?join=${encodeURIComponent(inviteCode)}`;
  }

  public getInviteLink(): string {
    const active = this.getActiveHousehold();
    return this.getHouseholdInviteLink(active.inviteCode);
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.client) this.initClient();
    if (!this.client) {
      return { success: false, message: 'חיבור ל-Supabase לא הוגדר (חסר URL או מפתח)' };
    }
    try {
      const { error } = await this.client.from('households').select('id').limit(1);
      if (error) {
        return { success: false, message: `שגיאה בחיבור: ${error.message}` };
      }
      return { success: true, message: 'החיבור ל-Supabase תקין ופעיל! 🟢' };
    } catch (e: any) {
      return { success: false, message: `שגיאה בבדיקת חיבור: ${e.message}` };
    }
  }

  public async createHousehold(
    name: string,
    creatorName: string,
    googleUser: GoogleUserProfile | null
  ): Promise<Household> {
    const newHousehold: Household = {
      id: `h_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim() || 'הבית שלנו 🏡',
      inviteCode: this.generateInviteCode(),
      createdAt: Date.now(),
      createdBy: creatorName || googleUser?.name || 'דניאל'
    };

    const currentList = this.getCachedHouseholds();
    const updatedList = [newHousehold, ...currentList.filter((h) => h.id !== newHousehold.id)];
    this.setCachedHouseholds(updatedList);
    this.setActiveHousehold(newHousehold);

    if (!this.client) this.initClient();
    if (this.client) {
      try {
        await this.client.from('households').insert({
          id: newHousehold.id,
          name: newHousehold.name,
          invite_code: newHousehold.inviteCode,
          created_by: newHousehold.createdBy
        });

        // Add creator as admin member
        const memberId = `mem_${Date.now()}`;
        await this.client.from('household_members').upsert({
          id: memberId,
          household_id: newHousehold.id,
          user_id: googleUser?.sub || memberId,
          name: creatorName || googleUser?.name || 'דניאל',
          email: googleUser?.email || '',
          avatar: '🌿',
          picture: googleUser?.picture || '',
          role: 'admin'
        });
      } catch (e) {
        console.warn('Failed to insert household to Supabase', e);
      }
    }

    return newHousehold;
  }

  public async joinHouseholdByCode(
    code: string,
    memberName: string,
    googleUser: GoogleUserProfile | null
  ): Promise<{ success: boolean; household?: Household; message?: string }> {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return { success: false, message: 'קוד הצטרפות ריק' };

    if (!this.client) this.initClient();
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('households')
          .select('*')
          .ilike('invite_code', cleanCode)
          .maybeSingle();

        if (error || !data) {
          return { success: false, message: 'קוד הצטרפות לא נמצא או שגוי' };
        }

        const foundHousehold: Household = {
          id: data.id,
          name: data.name,
          inviteCode: data.invite_code,
          createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
          createdBy: data.created_by || ''
        };

        // Add user to household_members table
        const memberId = `mem_${Date.now()}`;
        await this.client.from('household_members').upsert({
          id: memberId,
          household_id: foundHousehold.id,
          user_id: googleUser?.sub || memberId,
          name: memberName || googleUser?.name || 'שותף',
          email: googleUser?.email || '',
          avatar: '💧',
          picture: googleUser?.picture || '',
          role: 'member'
        });

        const currentList = this.getCachedHouseholds();
        const updatedList = [foundHousehold, ...currentList.filter((h) => h.id !== foundHousehold.id)];
        this.setCachedHouseholds(updatedList);
        this.setActiveHousehold(foundHousehold);

        return { success: true, household: foundHousehold };
      } catch (e: any) {
        return { success: false, message: e.message || 'שגיאה בהצטרפות לבית' };
      }
    }

    return { success: false, message: 'לא ניתן להתחבר לשרת כרגע' };
  }

  public async loadUserHouseholds(googleUser: GoogleUserProfile | null): Promise<Household[]> {
    if (!this.client) this.initClient();
    if (this.client && googleUser) {
      try {
        const { data: memberRows } = await this.client
          .from('household_members')
          .select('household_id')
          .or(`user_id.eq.${googleUser.sub},email.eq.${googleUser.email}`);

        if (memberRows && memberRows.length > 0) {
          const ids = memberRows.map((r) => r.household_id);
          const { data: householdRows } = await this.client
            .from('households')
            .select('*')
            .in('id', ids);

          if (householdRows && householdRows.length > 0) {
            const list: Household[] = householdRows.map((r: any) => ({
              id: r.id,
              name: r.name,
              inviteCode: r.invite_code,
              createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
              createdBy: r.created_by || ''
            }));
            this.setCachedHouseholds(list);
            return list;
          }
        }
      } catch (e) {
        console.warn('Error loading user households', e);
      }
    }
    return this.getCachedHouseholds();
  }

  // ==========================================
  // --- Photo Upload to Supabase Storage ---
  // ==========================================
  public async uploadPhoto(blobOrFile: Blob | File): Promise<string> {
    if (!this.client) this.initClient();
    if (this.client) {
      try {
        const ext = 'jpg';
        const fileName = `plant_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const { data, error } = await this.client.storage
          .from('plant-photos')
          .upload(fileName, blobOrFile, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (!error && data?.path) {
          const { data: publicUrlData } = this.client.storage
            .from('plant-photos')
            .getPublicUrl(data.path);
          if (publicUrlData?.publicUrl) {
            return publicUrlData.publicUrl;
          }
        }
      } catch (e) {
        console.warn('Storage upload error, using fallback dataUrl', e);
      }
    }
    return '';
  }

  // ==========================================
  // --- Realtime Updates Subscription ---
  // ==========================================
  public subscribeToRealtimeUpdates(onUpdate: () => void) {
    if (!this.client) this.initClient();
    if (!this.client) return () => {};

    const channel = this.client
      .channel('plants-live-sync-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'households' }, () => onUpdate())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'household_members' }, () => onUpdate())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plants' }, () => onUpdate())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plant_care_logs' }, () => onUpdate())
      .subscribe();

    return () => {
      if (this.client) {
        this.client.removeChannel(channel);
      }
    };
  }

  // ==========================================
  // --- Load Plants, Logs & Members by Household ---
  // ==========================================
  public async loadAllData(householdId?: string): Promise<{
    household: Household;
    plants: Plant[];
    logs: PlantCareLog[];
    members: HouseholdMember[];
    source: 'remote' | 'local';
  }> {
    const activeHousehold = this.getActiveHousehold();
    const targetHId = householdId || activeHousehold.id;

    if (!this.client) this.initClient();

    if (this.client) {
      try {
        const [hRes, pRes, lRes, mRes] = await Promise.all([
          this.client.from('households').select('*').eq('id', targetHId).maybeSingle(),
          this.client.from('plants').select('*').eq('household_id', targetHId).order('created_at', { ascending: false }),
          this.client.from('plant_care_logs').select('*').eq('household_id', targetHId).order('created_at', { ascending: false }).limit(100),
          this.client.from('household_members').select('*').eq('household_id', targetHId)
        ]);

        if (!pRes.error) {
          this.remoteTablesReady = true;

          let loadedHousehold = activeHousehold;
          if (hRes.data) {
            loadedHousehold = {
              id: hRes.data.id,
              name: hRes.data.name,
              inviteCode: hRes.data.invite_code,
              createdAt: hRes.data.created_at ? new Date(hRes.data.created_at).getTime() : Date.now(),
              createdBy: hRes.data.created_by || ''
            };
            this.setActiveHousehold(loadedHousehold);
          }

          let remotePlants: Plant[] = (pRes.data || []).map((r: any) => this.rowToPlant(r));
          let remoteLogs: PlantCareLog[] = (lRes.data || []).map((r: any) => ({
            id: r.id,
            householdId: r.household_id || targetHId,
            plantId: r.plant_id,
            plantName: r.plant_name,
            action: r.action,
            performedBy: r.performed_by,
            timestamp: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
            notes: r.notes || ''
          }));
          let remoteMembers: HouseholdMember[] = (mRes.data || []).map((r: any) => ({
            id: r.id,
            householdId: r.household_id || targetHId,
            userId: r.user_id,
            name: r.name,
            email: r.email || '',
            avatar: r.avatar || '🌿',
            picture: r.picture || '',
            role: r.role || 'member'
          }));

          // Seed demo plants for default household if table is fresh
          if (remotePlants.length === 0 && targetHId === 'default_home') {
            const localPlants = this.getLocalPlants();
            remotePlants = localPlants;
            for (const p of localPlants) {
              await this.client.from('plants').upsert(this.plantToRow(p, targetHId));
            }
          }

          if (remoteMembers.length === 0 && targetHId === 'default_home') {
            remoteMembers = INITIAL_MEMBERS;
            for (const m of INITIAL_MEMBERS) {
              await this.client.from('household_members').upsert({
                id: m.id,
                household_id: targetHId,
                user_id: m.userId,
                name: m.name,
                avatar: m.avatar,
                role: m.role || 'member'
              });
            }
          }

          localStorage.setItem(STORAGE_KEYS.PLANTS_CACHE, JSON.stringify(remotePlants));
          localStorage.setItem(STORAGE_KEYS.LOGS_CACHE, JSON.stringify(remoteLogs));
          localStorage.setItem(STORAGE_KEYS.MEMBERS_CACHE, JSON.stringify(remoteMembers));

          return {
            household: loadedHousehold,
            plants: remotePlants,
            logs: remoteLogs,
            members: remoteMembers,
            source: 'remote'
          };
        }
      } catch (e) {
        console.warn('Supabase fetch error, fallback to local', e);
      }
    }

    return {
      household: activeHousehold,
      plants: this.getLocalPlants(),
      logs: this.getLocalLogs(),
      members: this.getLocalMembers(),
      source: 'local'
    };
  }

  // --- Map Plant <-> Row ---
  private rowToPlant(row: any): Plant {
    return {
      id: row.id,
      householdId: row.household_id || 'default_home',
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

  private plantToRow(plant: Plant, householdId?: string) {
    const hId = householdId || plant.householdId || this.getActiveHousehold().id;
    return {
      id: plant.id,
      household_id: hId,
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
        const hId = log.householdId || this.getActiveHousehold().id;
        await this.client.from('plant_care_logs').insert({
          id: log.id,
          household_id: hId,
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
        const hId = this.getActiveHousehold().id;
        for (const m of members) {
          await this.client.from('household_members').upsert({
            id: m.id,
            household_id: hId,
            user_id: m.userId || m.id,
            name: m.name,
            avatar: m.avatar,
            role: m.role || 'member'
          });
        }
      } catch (e) {
        console.error('Failed to sync members to Supabase', e);
      }
    }
  }
}

export const plantSupabase = new PlantSupabaseService();
