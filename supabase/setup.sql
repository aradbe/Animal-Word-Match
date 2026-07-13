-- ============================================================
-- Animal Word Match - Supabase Database Setup
-- ============================================================
--
-- Access rules:
--   - Guests and logged-in users can read questions and play.
--   - Only logged-in users can save and read their own results.
--   - Users can only read their own profile.
--
-- Note:
--   The "animal-images" Storage bucket was created manually
--   in the Supabase dashboard.
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
  
  role text not null default 'kid'
  check (role in ('kid', 'admin')),

  created_at timestamptz not null
    default now()
);

-- If the profiles table already exists, make sure the role column exists too.
alter table public.profiles
add column if not exists role text not null default 'kid'
check (role in ('kid', 'admin'));

-- ============================================================
-- AUTOMATIC PROFILE CREATION
-- ============================================================

-- Creates a profile whenever a new user registers.

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
      when lower(new.email) = 'admin@admin.com' then 'admin'
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
--
-- Matches the frontend MOCK_QUESTIONS structure:
--
-- {
--   id,
--   image_url,
--   correct_word,
--   distractors,
--   level,
--   topic,
--   created_at
-- }
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
    default now(),

  constraint questions_have_three_distractors
    check (
      cardinality(distractors) = 3
    ),

  constraint question_level_is_positive
    check (
      level > 0
    ),

  constraint correct_word_not_in_distractors
    check (
      array_position(distractors, correct_word) is null
    )
);


create index if not exists questions_topic_level_index
on public.questions (
  topic,
  level
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
    default now(),

  constraint score_is_not_negative
    check (
      score >= 0
    ),

  constraint total_questions_is_positive
    check (
      total_questions > 0
    ),

  constraint score_not_above_total
    check (
      score <= total_questions
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

-- Guests cannot access profiles at all.

revoke all
on public.profiles
from anon;


-- Reset old permissions for logged-in users.
-- This removes older grants like update if this script was run before.

revoke all
on public.profiles
from authenticated;


-- Logged-in users can only read profiles.
-- RLS will ensure that they only access their own profile.

grant select
on public.profiles
to authenticated;


-- Guests cannot access saved game results.

revoke all
on public.game_results
from anon;


-- Guests and logged-in users can read questions.

grant select
on public.questions
to anon, authenticated;


-- Frontend users cannot create, edit, or delete questions.

revoke insert, update, delete
on public.questions
from anon, authenticated;


-- Logged-in users can read and save game results.
-- RLS will ensure that they only access their own results.

grant select, insert
on public.game_results
to authenticated;

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


drop policy if exists
  "Users can update their own profile"
on public.profiles;

-- ============================================================
-- QUESTIONS RLS POLICIES
-- ============================================================
--
-- Guests and logged-in users can read questions.
-- No frontend role can insert, update, or delete questions.
-- ============================================================

-- Remove the previous registered-users-only policy.

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

grant select on public.questions
to anon, authenticated;


-- ============================================================
-- GAME RESULTS RLS POLICIES
-- ============================================================
--
-- Guests cannot save scores.
-- Logged-in users can only read and save their own results.
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


-- ============================================================
-- INITIAL MOCK QUESTIONS
-- ============================================================

insert into public.questions (
  id,
  image_url,
  correct_word,
  distractors,
  level,
  topic,
  created_at
)
values
(
  'mock-1',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Cow_female_black_white.jpg?width=600',
  'cow',
  array['pig', 'horse', 'sheep'],
  1,
  'farm',
  '2026-07-09T09:00:00.000Z'
),
(
  'mock-2',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Nokota_Horses.jpg?width=600',
  'horse',
  array['cow', 'goat', 'sheep'],
  1,
  'farm',
  '2026-07-09T09:01:00.000Z'
),
(
  'mock-3',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Rooster_portrait2.jpg?width=600',
  'chicken',
  array['duck', 'goose', 'turkey'],
  2,
  'farm',
  '2026-07-09T09:02:00.000Z'
),
(
  'mock-4',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Tursiops_truncatus_01.jpg?width=600',
  'dolphin',
  array['shark', 'whale', 'seal'],
  2,
  'sea',
  '2026-07-09T09:03:00.000Z'
),
(
  'mock-5',
  'https://commons.wikimedia.org/wiki/Special:FilePath/Octopus_vulgaris_2.jpg?width=600',
  'octopus',
  array['squid', 'crab', 'jellyfish'],
  3,
  'sea',
  '2026-07-09T09:04:00.000Z'
)
on conflict (id) do nothing;


