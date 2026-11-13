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
