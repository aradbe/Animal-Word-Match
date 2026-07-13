-- ============================================================
-- Animal Word Match - Supabase Database Setup
-- ============================================================
--
-- Access rules:
--   - Guests and logged-in users can read questions and play.
--   - Only logged-in users can save and read their own results.
--   - Users can only read their own profile.
--   - Frontend users cannot create, update, or delete questions.
--   - Question generation and deletion happen through
--     protected Supabase Edge Functions.
--
-- Note:
--   The public "animal-images" Storage bucket is created
--   manually in the Supabase dashboard.
--
--   The 35 real questions are added separately using
--   seed-all.mjs. This file does not insert mock questions.
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

create extension if not exists pgcrypto;


-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key
    references auth.users(id)
    on delete cascade,

  display_name text,

  role text not null
    default 'kid',

  created_at timestamptz not null
    default now()
);


-- Make sure older versions of the table contain the role column.

alter table public.profiles
add column if not exists role text not null
default 'kid';


-- Only allow valid application roles.

alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check
check (
  role in ('kid', 'admin')
);


-- ============================================================
-- AUTOMATIC PROFILE CREATION
-- ============================================================

-- Creates a profile automatically whenever a new user registers.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    role
  )
  values (
    new.id,

    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(new.email, '@', 1)
    ),

    case
      when lower(new.email) = 'admin@admin.com'
        then 'admin'
      else 'kid'
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;


drop trigger if exists on_auth_user_created
on auth.users;


create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();


-- ============================================================
-- 2. QUESTIONS TABLE
-- ============================================================

create table if not exists public.questions (
  id text primary key
    default gen_random_uuid()::text,

  image_url text not null,

  correct_word text not null,

  distractors text[] not null,

  level smallint not null
    default 1,

  topic text not null,

  created_at timestamptz not null
    default now()
);


-- Ensure required columns remain non-null.

alter table public.questions
alter column image_url set not null;

alter table public.questions
alter column correct_word set not null;

alter table public.questions
alter column distractors set not null;

alter table public.questions
alter column level set not null;

alter table public.questions
alter column topic set not null;


-- Each question must contain exactly three distractors.

alter table public.questions
drop constraint if exists questions_have_three_distractors;

alter table public.questions
add constraint questions_have_three_distractors
check (
  cardinality(distractors) = 3
);


-- The correct answer cannot also be a distractor.

alter table public.questions
drop constraint if exists correct_word_not_in_distractors;

alter table public.questions
add constraint correct_word_not_in_distractors
check (
  array_position(distractors, correct_word) is null
);


-- Only levels 1, 2 and 3 are valid.

alter table public.questions
drop constraint if exists question_level_is_positive;

alter table public.questions
drop constraint if exists question_level_is_valid;

alter table public.questions
add constraint question_level_is_valid
check (
  level between 1 and 3
);


-- Only the five game topics are valid.

alter table public.questions
drop constraint if exists question_topic_is_valid;

alter table public.questions
add constraint question_topic_is_valid
check (
  topic in (
    'farm',
    'sea',
    'jungle',
    'forest',
    'arctic'
  )
);


-- Empty values are not valid questions.

alter table public.questions
drop constraint if exists question_correct_word_not_empty;

alter table public.questions
add constraint question_correct_word_not_empty
check (
  length(trim(correct_word)) > 0
);


alter table public.questions
drop constraint if exists question_image_url_not_empty;

alter table public.questions
add constraint question_image_url_not_empty
check (
  length(trim(image_url)) > 0
);


-- Used when loading questions by topic and level.

create index if not exists questions_topic_level_index
on public.questions (
  topic,
  level
);


-- Prevent the same animal from being inserted more than once
-- in the same topic, even if capitalization is different.

create unique index if not exists questions_unique_topic_animal
on public.questions (
  lower(topic),
  lower(correct_word)
);


-- ============================================================
-- 3. GAME RESULTS TABLE
-- ============================================================

create table if not exists public.game_results (
  id uuid primary key
    default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  score smallint not null,

  total_questions smallint not null
    default 5,

  topic text,

  level smallint,

  created_at timestamptz not null
    default now()
);


alter table public.game_results
drop constraint if exists score_is_not_negative;

alter table public.game_results
add constraint score_is_not_negative
check (
  score >= 0
);


alter table public.game_results
drop constraint if exists total_questions_is_positive;

alter table public.game_results
add constraint total_questions_is_positive
check (
  total_questions > 0
);


alter table public.game_results
drop constraint if exists score_not_above_total;

alter table public.game_results
add constraint score_not_above_total
check (
  score <= total_questions
);


alter table public.game_results
drop constraint if exists game_result_level_is_valid;

alter table public.game_results
add constraint game_result_level_is_valid
check (
  level is null
  or level between 1 and 3
);


alter table public.game_results
drop constraint if exists game_result_topic_is_valid;

alter table public.game_results
add constraint game_result_topic_is_valid
check (
  topic is null
  or topic in (
    'farm',
    'sea',
    'jungle',
    'forest',
    'arctic'
  )
);


create index if not exists game_results_user_date_index
on public.game_results (
  user_id,
  created_at desc
);


-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles
enable row level security;

alter table public.questions
enable row level security;

alter table public.game_results
enable row level security;


-- ============================================================
-- TABLE PERMISSIONS
-- ============================================================

-- Reset previous permissions first.

revoke all
on public.profiles
from anon, authenticated;


revoke all
on public.questions
from anon, authenticated;


revoke all
on public.game_results
from anon, authenticated;


-- Logged-in users may read their own profile.
-- RLS controls which profile row they can access.

grant select
on public.profiles
to authenticated;


-- Guests and logged-in users may read questions.

grant select
on public.questions
to anon, authenticated;


-- Logged-in users may read and save their own results.
-- RLS controls which result rows they can access.

grant select, insert
on public.game_results
to authenticated;


-- No frontend role receives INSERT, UPDATE or DELETE
-- permissions on questions. Edge Functions use the
-- Supabase admin client for privileged operations.


-- ============================================================
-- PROFILES RLS POLICIES
-- ============================================================

drop policy if exists
  "Users can read their own profile"
on public.profiles;


create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) = id
);


-- Remove the previous update policy.
-- Users cannot update their role or other profile fields
-- directly from the frontend.

drop policy if exists
  "Users can update their own profile"
on public.profiles;


-- ============================================================
-- QUESTIONS RLS POLICIES
-- ============================================================

drop policy if exists
  "Authenticated users can read questions"
on public.questions;


drop policy if exists
  "Anyone can read questions"
on public.questions;


create policy "Anyone can read questions"
on public.questions
for select
to anon, authenticated
using (true);


-- ============================================================
-- GAME RESULTS RLS POLICIES
-- ============================================================

drop policy if exists
  "Users can read their own game results"
on public.game_results;


create policy "Users can read their own game results"
on public.game_results
for select
to authenticated
using (
  (select auth.uid()) = user_id
);


drop policy if exists
  "Users can insert their own game results"
on public.game_results;


create policy "Users can insert their own game results"
on public.game_results
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
);