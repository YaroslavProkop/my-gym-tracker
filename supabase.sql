-- Виконай цей SQL у Supabase: SQL Editor -> New query -> Run.
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null default current_date,
  day_name text not null,
  body_weight numeric(5,2),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_name text not null,
  set_number integer not null,
  weight numeric(7,2) not null default 0,
  reps integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.workouts enable row level security;
alter table public.exercise_logs enable row level security;

create policy "Users manage own workouts" on public.workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own exercise logs" on public.exercise_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists workouts_user_date_idx on public.workouts(user_id, workout_date desc);
create index if not exists exercise_logs_workout_idx on public.exercise_logs(workout_id);
