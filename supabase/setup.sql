-- Mechanical Academic Resource Hub: complete database setup (run once)

-- =====================================================================
-- 01_schema.sql  |  Tables, indexes, triggers, views and helper functions
-- Safe to run more than once.
-- =====================================================================

create extension if not exists pg_trgm with schema extensions;

-- ---------- Tables ----------------------------------------------------

create table if not exists public.semesters (
  id          uuid primary key default gen_random_uuid(),
  number      smallint not null unique check (number between 1 and 8),
  name        text not null check (char_length(trim(name)) > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.teachers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(trim(name)) > 0),
  phone       text,
  email       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.subjects (
  id            uuid primary key default gen_random_uuid(),
  semester_id   uuid not null references public.semesters (id) on delete restrict,
  teacher_id    uuid references public.teachers (id) on delete set null,
  name          text not null check (char_length(trim(name)) > 0),
  code          text,
  credit_hours  numeric(3,1) check (credit_hours is null or credit_hours >= 0),
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.resources (
  id           uuid primary key default gen_random_uuid(),
  subject_id   uuid not null references public.subjects (id) on delete cascade,
  title        text not null check (char_length(trim(title)) > 0),
  author       text,
  description  text,
  category     text not null check (category in
                 ('reference_book', 'study_material', 'suggestion', 'assignment', 'other')),
  file_type    text not null default 'pdf' check (file_type in ('pdf')),
  file_path    text not null unique,
  file_name    text not null,
  file_size    bigint check (file_size is null or file_size >= 0),
  mime_type    text not null default 'application/pdf',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Exactly one administrator may exist (see the unique index below).
create table if not exists public.admin_profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);
create unique index if not exists admin_profiles_single_admin on public.admin_profiles ((true));

-- ---------- Indexes ---------------------------------------------------

create index if not exists subjects_semester_idx   on public.subjects (semester_id);
create index if not exists subjects_teacher_idx    on public.subjects (teacher_id);
create index if not exists resources_subject_idx   on public.resources (subject_id);
create index if not exists resources_category_idx  on public.resources (category);
create index if not exists resources_created_idx   on public.resources (created_at desc);
create index if not exists resources_title_trgm    on public.resources using gin (title extensions.gin_trgm_ops);
create index if not exists resources_desc_trgm     on public.resources using gin (description extensions.gin_trgm_ops);
create index if not exists resources_author_trgm   on public.resources using gin (author extensions.gin_trgm_ops);
create index if not exists subjects_name_trgm      on public.subjects using gin (name extensions.gin_trgm_ops);

-- ---------- updated_at triggers ----------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_semesters_updated_at on public.semesters;
create trigger set_semesters_updated_at before update on public.semesters
  for each row execute function public.set_updated_at();

drop trigger if exists set_teachers_updated_at on public.teachers;
create trigger set_teachers_updated_at before update on public.teachers
  for each row execute function public.set_updated_at();

drop trigger if exists set_subjects_updated_at on public.subjects;
create trigger set_subjects_updated_at before update on public.subjects
  for each row execute function public.set_updated_at();

drop trigger if exists set_resources_updated_at on public.resources;
create trigger set_resources_updated_at before update on public.resources
  for each row execute function public.set_updated_at();

-- ---------- Administrator check ---------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_profiles where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- Read-only views used by the website ------------------------
-- security_invoker makes the views obey the Row Level Security of the caller.

create or replace view public.semester_overview with (security_invoker = true) as
select
  s.id,
  s.number,
  s.name,
  (select count(*) from public.subjects sb where sb.semester_id = s.id) as subject_count,
  (select count(*) from public.resources r
     join public.subjects sb on sb.id = r.subject_id
    where sb.semester_id = s.id) as resource_count,
  (select count(*) from public.resources r
     join public.subjects sb on sb.id = r.subject_id
    where sb.semester_id = s.id and r.category = 'assignment') as assignment_count
from public.semesters s;

create or replace view public.subject_overview with (security_invoker = true) as
select
  sb.id, sb.semester_id, sb.teacher_id, sb.name, sb.code, sb.credit_hours,
  sb.description, sb.created_at, sb.updated_at,
  t.name  as teacher_name,
  t.phone as teacher_phone,
  t.email as teacher_email,
  s.number as semester_number,
  s.name   as semester_name,
  (select count(*) from public.resources r where r.subject_id = sb.id) as resource_count,
  (select count(*) from public.resources r
    where r.subject_id = sb.id and r.category = 'assignment') as assignment_count
from public.subjects sb
join public.semesters s on s.id = sb.semester_id
left join public.teachers t on t.id = sb.teacher_id;

create or replace view public.resource_search with (security_invoker = true) as
select
  r.id, r.subject_id, r.title, r.author, r.description, r.category, r.file_type,
  r.file_path, r.file_name, r.file_size, r.mime_type, r.created_at, r.updated_at,
  sb.name as subject_name,
  sb.code as subject_code,
  sb.teacher_id,
  t.name  as teacher_name,
  s.id     as semester_id,
  s.number as semester_number,
  s.name   as semester_name
from public.resources r
join public.subjects sb on sb.id = r.subject_id
join public.semesters s on s.id = sb.semester_id
left join public.teachers t on t.id = sb.teacher_id;

create or replace function public.dashboard_stats()
returns json
language sql
stable
security invoker
set search_path = public
as $$
  select json_build_object(
    'semesters',       (select count(*) from public.semesters),
    'subjects',        (select count(*) from public.subjects),
    'resources',       (select count(*) from public.resources),
    'assignments',     (select count(*) from public.resources where category = 'assignment'),
    'reference_books', (select count(*) from public.resources where category = 'reference_book'),
    'study_materials', (select count(*) from public.resources where category = 'study_material'),
    'suggestions',     (select count(*) from public.resources where category = 'suggestion'),
    'other_documents', (select count(*) from public.resources where category = 'other')
  );
$$;

grant select on public.semester_overview, public.subject_overview, public.resource_search
  to anon, authenticated;
grant execute on function public.dashboard_stats() to anon, authenticated;

-- =====================================================================
-- 02_rls_policies.sql  |  Row Level Security
-- Public visitors: read-only.  Administrator: full write access.
-- Safe to run more than once.
-- =====================================================================

alter table public.semesters      enable row level security;
alter table public.teachers       enable row level security;
alter table public.subjects       enable row level security;
alter table public.resources      enable row level security;
alter table public.admin_profiles enable row level security;

-- Defense in depth: anonymous visitors never get write privileges.
revoke insert, update, delete, truncate on
  public.semesters, public.teachers, public.subjects, public.resources, public.admin_profiles
  from anon;
-- Nobody can change admin_profiles through the API (only via the SQL Editor).
revoke insert, update, delete, truncate on public.admin_profiles from authenticated;

do $$
declare
  t text;
begin
  foreach t in array array['semesters', 'teachers', 'subjects', 'resources'] loop
    execute format('drop policy if exists "Public can read %1$s" on public.%1$I', t);
    execute format('drop policy if exists "Admin can insert %1$s" on public.%1$I', t);
    execute format('drop policy if exists "Admin can update %1$s" on public.%1$I', t);
    execute format('drop policy if exists "Admin can delete %1$s" on public.%1$I', t);

    execute format('create policy "Public can read %1$s" on public.%1$I
                      for select to anon, authenticated using (true)', t);
    execute format('create policy "Admin can insert %1$s" on public.%1$I
                      for insert to authenticated with check (public.is_admin())', t);
    execute format('create policy "Admin can update %1$s" on public.%1$I
                      for update to authenticated
                      using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy "Admin can delete %1$s" on public.%1$I
                      for delete to authenticated using (public.is_admin())', t);
  end loop;
end
$$;

-- A signed-in user may only see their own admin_profiles row (used by the app
-- to decide whether to show the dashboard). No insert/update/delete policies.
drop policy if exists "Users can read own admin profile" on public.admin_profiles;
create policy "Users can read own admin profile" on public.admin_profiles
  for select to authenticated using (user_id = auth.uid());

-- =====================================================================
-- 03_storage.sql  |  Storage bucket "academic-resources" and its policies
-- Safe to run more than once.
-- File size limit below is 20 MB (20971520 bytes). Change it here AND in
-- the VITE_MAX_PDF_MB environment variable if you want a different limit.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('academic-resources', 'academic-resources', true, 20971520, array['application/pdf'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read academic resources" on storage.objects;
drop policy if exists "Admin can upload academic resources" on storage.objects;
drop policy if exists "Admin can update academic resources" on storage.objects;
drop policy if exists "Admin can delete academic resources" on storage.objects;

create policy "Public can read academic resources" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'academic-resources');

create policy "Admin can upload academic resources" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'academic-resources' and public.is_admin());

create policy "Admin can update academic resources" on storage.objects
  for update to authenticated
  using (bucket_id = 'academic-resources' and public.is_admin())
  with check (bucket_id = 'academic-resources' and public.is_admin());

create policy "Admin can delete academic resources" on storage.objects
  for delete to authenticated
  using (bucket_id = 'academic-resources' and public.is_admin());

-- =====================================================================
-- 04_seed.sql  |  The 8 semesters. No subjects or teachers are invented:
-- add real ones from the Admin Dashboard.
-- =====================================================================

insert into public.semesters (number, name) values
  (1, '1st Semester'),
  (2, '2nd Semester'),
  (3, '3rd Semester'),
  (4, '4th Semester'),
  (5, '5th Semester'),
  (6, '6th Semester'),
  (7, '7th Semester'),
  (8, '8th Semester')
on conflict (number) do nothing;
