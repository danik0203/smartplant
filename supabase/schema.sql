-- =========================================================================
-- Supabase Schema for "המשתלה הביתית" (Home Plants Care & AI Doctor PWA)
-- העתק את כל הקוד הזה והדבק ב-Supabase > SQL Editor ולחץ RUN
-- =========================================================================

-- 1. טבלת צמחים (Plants)
create table if not exists public.plants (
  id text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
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

-- 2. טבלת יומן השקיות וטיפולים בבית (Plant Care Logs)
create table if not exists public.plant_care_logs (
  id text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  plant_id text not null,
  plant_name text not null,
  action text not null,
  performed_by text not null,
  notes text default ''
);

-- 3. טבלת דיירי הבית / שותפים (Household Members)
create table if not exists public.plant_members (
  id text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  avatar text default '🌿',
  color text default '#16a34a',
  phone text default '',
  google_email text default '',
  picture text default ''
);

-- 4. אפשור גישה בזמן אמת (Enable Realtime)
alter publication supabase_realtime add table public.plants;
alter publication supabase_realtime add table public.plant_care_logs;
alter publication supabase_realtime add table public.plant_members;

-- 5. הגדרת פוליסות גישה חופשית לקריאה וכתיבה לבני הבית
alter table public.plants enable row level security;
alter table public.plant_care_logs enable row level security;
alter table public.plant_members enable row level security;

create policy "Allow all operations for plants" on public.plants for all using (true) with check (true);
create policy "Allow all operations for plant_care_logs" on public.plant_care_logs for all using (true) with check (true);
create policy "Allow all operations for plant_members" on public.plant_members for all using (true) with check (true);

-- 6. באקט אחסון תמונות צמחים ציבורי (Plant Photos Storage Bucket)
insert into storage.buckets (id, name, public)
values ('plant-photos', 'plant-photos', true)
on conflict (id) do nothing;

create policy "Public Access for Plant Photos"
on storage.objects for select using (bucket_id = 'plant-photos');

create policy "Public Insert for Plant Photos"
on storage.objects for insert with check (bucket_id = 'plant-photos');

create policy "Public Update for Plant Photos"
on storage.objects for update using (bucket_id = 'plant-photos');
