-- =========================================================================
-- Supabase Schema for "SmartPlant" (המשתלה הביתית)
-- קבוצות / בתים משותפים, שותפים, צמחים, יומן השקיות, התחברות Google ובאקט תמונות
-- גרסה בטוחה (Idempotent): מתמודדת עם טבלאות קיימות, עמודות חסרות ומדיניות קיימת
-- =========================================================================

-- 1. טבלת בתים / קבוצות משותפות (Households / Gardens)
create table if not exists public.households (
  id text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  invite_code text unique not null,
  created_by text default ''
);

-- 2. טבלת חברי הבית / שותפים (Household Members)
create table if not exists public.household_members (
  id text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  household_id text not null references public.households(id) on delete cascade,
  user_id text not null,
  name text not null,
  email text default '',
  avatar text default '🌿',
  picture text default '',
  role text not null default 'member',
  unique (household_id, user_id)
);

-- 3. טבלת צמחים (Plants)
create table if not exists public.plants (
  id text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  household_id text default 'default_home',
  name text not null,
  nickname text default '',
  species text default '',
  room text not null default 'living_room',
  image_url text default '',
  watering_frequency_days integer not null default 7,
  water_amount_ml integer not null default 250,
  watering_tips text default '',
  last_watered_at text not null,
  last_watered_by text default 'אני',
  snoozed_until text default '',
  fertilize_frequency_days integer default 30,
  last_fertilized_at text default '',
  mist_frequency_days integer default 0,
  last_misted_at text default '',
  soil_type text not null default 'all_purpose',
  soil_description text default '',
  has_drainage_hole boolean default true,
  sunlight text not null default 'bright_indirect',
  humidity text not null default 'medium',
  temperature_range text default '18°C - 28°C',
  is_pet_safe boolean default true,
  health_status text not null default 'healthy',
  health_score integer not null default 90,
  current_issues jsonb not null default '[]'::jsonb,
  care_recommendations jsonb not null default '[]'::jsonb,
  diagnosis_history jsonb not null default '[]'::jsonb,
  notes text default ''
);

-- אם טבלת plants כבר הייתה קיימת ללא household_id - נוסיף את העמודה עכשיו
alter table public.plants add column if not exists household_id text default 'default_home';

-- 4. טבלת יומן השקיות ופעולות בבית (Plant Care Logs)
create table if not exists public.plant_care_logs (
  id text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  household_id text default 'default_home',
  plant_id text not null,
  plant_name text not null,
  action text not null,
  performed_by text not null,
  notes text default ''
);

-- אם טבלת plant_care_logs כבר הייתה קיימת ללא household_id - נוסיף את העמודה עכשיו
alter table public.plant_care_logs add column if not exists household_id text default 'default_home';

-- הוספת בית ברירת מחדל במידה ואינו קיים
insert into public.households (id, name, invite_code, created_by)
values ('default_home', 'הבית שלנו 🏡', 'PLANT-HOME', 'admin')
on conflict (id) do nothing;

-- 5. אינדקסים למהירות שליפה
create index if not exists idx_plants_household on public.plants(household_id);
create index if not exists idx_logs_household on public.plant_care_logs(household_id);
create index if not exists idx_members_household on public.household_members(household_id);
create index if not exists idx_households_invite on public.households(invite_code);

-- 6. סנכרון בלייב (Realtime) - עטוף בבלוק כדי למנוע שגיאות אם כבר הוגדר
do $$
begin
  begin
    alter publication supabase_realtime add table public.households;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.household_members;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.plants;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.plant_care_logs;
  exception when duplicate_object then null;
  end;
end $$;

-- 7. הגדרת אבטחת שורות (RLS) ומדיניות גישה מלאה
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.plants enable row level security;
alter table public.plant_care_logs enable row level security;

drop policy if exists "Allow all operations for households" on public.households;
create policy "Allow all operations for households" on public.households for all using (true) with check (true);

drop policy if exists "Allow all operations for household_members" on public.household_members;
create policy "Allow all operations for household_members" on public.household_members for all using (true) with check (true);

drop policy if exists "Allow all operations for plants" on public.plants;
create policy "Allow all operations for plants" on public.plants for all using (true) with check (true);

drop policy if exists "Allow all operations for plant_care_logs" on public.plant_care_logs;
create policy "Allow all operations for plant_care_logs" on public.plant_care_logs for all using (true) with check (true);

-- 8. באקט אחסון תמונות צמחים (Storage Bucket)
insert into storage.buckets (id, name, public)
values ('plant-photos', 'plant-photos', true)
on conflict (id) do nothing;

drop policy if exists "Public Access for Plant Photos" on storage.objects;
create policy "Public Access for Plant Photos" on storage.objects for select using (bucket_id = 'plant-photos');

drop policy if exists "Public Insert for Plant Photos" on storage.objects;
create policy "Public Insert for Plant Photos" on storage.objects for insert with check (bucket_id = 'plant-photos');

drop policy if exists "Public Update for Plant Photos" on storage.objects;
create policy "Public Update for Plant Photos" on storage.objects for update using (bucket_id = 'plant-photos');
