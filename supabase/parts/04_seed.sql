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
