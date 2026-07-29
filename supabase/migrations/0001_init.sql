-- ExamBD initial schema
-- Run via: supabase db push   OR   psql < 0001_init.sql   OR   prisma migrate deploy (schema.prisma is source of truth for app tables)
-- This file additionally sets up the auth.users trigger and RLS policies that Prisma migrations do not manage.

create extension if not exists pgcrypto;
create extension if not exists moddatetime;

-- ============ ROLES SEED ============
insert into roles (id, name) values (1,'super_admin'),(2,'admin'),(3,'student')
  on conflict (id) do nothing;

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
-- When Supabase Auth creates a new auth.users row, mirror a public.users profile row.
create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public.users (id, role_id, full_name, phone)
  values (
    new.id,
    3, -- default role: student
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ============ TRIGGERS: single-correct-option enforcement ============
create or replace function enforce_single_correct_option() returns trigger as $$
begin
  if (select question_type from questions where id = new.question_id) = 'single_choice' then
    if new.is_correct then
      update question_options set is_correct = false
        where question_id = new.question_id and id <> new.id;
    end if;
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_single_correct on question_options;
create trigger trg_single_correct
  after insert or update on question_options
  for each row execute function enforce_single_correct_option();

-- ============ updated_at triggers ============
drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at before update on users
  for each row execute procedure moddatetime(updated_at);

drop trigger if exists trg_questions_updated_at on questions;
create trigger trg_questions_updated_at before update on questions
  for each row execute procedure moddatetime(updated_at);

-- ============ ONE ACTIVE ATTEMPT PER STUDENT PER EXAM ============
drop index if exists uq_active_attempt;
create unique index uq_active_attempt on exam_attempts(exam_id, student_id)
  where status = 'in_progress';

-- ============ ROW LEVEL SECURITY ============
alter table question_options enable row level security;
alter table exam_attempt_options enable row level security;
alter table student_answers enable row level security;
alter table exam_attempts enable row level security;
alter table bookmarks enable row level security;
alter table notifications enable row level security;

-- Raw options (with is_correct) are never selectable by anon/authenticated roles.
-- Only the service_role (used by the NestJS backend's pooled connection) bypasses RLS.
create policy "deny direct client access to raw options"
  on question_options for select
  using (false);

create policy "students read only their own attempt's shuffled options"
  on exam_attempt_options for select
  using (attempt_id in (select id from exam_attempts where student_id = auth.uid()));

create policy "students read/write only their own answers"
  on student_answers for all
  using (attempt_id in (select id from exam_attempts where student_id = auth.uid()))
  with check (attempt_id in (select id from exam_attempts where student_id = auth.uid()));

create policy "students read only their own attempts"
  on exam_attempts for select
  using (student_id = auth.uid());

create policy "students manage only their own bookmarks"
  on bookmarks for all
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

create policy "users read only their own notifications"
  on notifications for select
  using (user_id = auth.uid());
