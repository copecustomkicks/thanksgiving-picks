-- Thanksgiving Picks — initial schema, RLS, leaderboard RPC, realtime

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  year int not null,
  dog_show_lock_at timestamptz,
  football_lock_at timestamptz,
  dog_show_locked_manual boolean not null default false,
  football_locked_manual boolean not null default false,
  best_in_show_points int not null default 0,
  created_at timestamptz not null default now()
);

-- Family code is server-only (service role). No client policies on this table.
create table public.event_secrets (
  event_id uuid primary key references public.events (id) on delete cascade,
  family_code text not null
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.event_participants (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index event_participants_user_idx on public.event_participants (user_id);

create table public.dog_groups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  points_per_correct int not null default 1
);

create index dog_groups_event_id_idx on public.dog_groups (event_id);

create table public.dog_entries (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.dog_groups (id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);

create index dog_entries_group_id_idx on public.dog_entries (group_id);

create table public.dog_group_picks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  participant_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid not null references public.dog_groups (id) on delete cascade,
  dog_entry_id uuid references public.dog_entries (id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (participant_id, group_id)
);

create index dog_group_picks_event_idx on public.dog_group_picks (event_id);

create table public.dog_best_in_show_picks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  participant_id uuid not null references public.profiles (id) on delete cascade,
  dog_entry_id uuid references public.dog_entries (id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (participant_id, event_id)
);

create table public.dog_group_results (
  group_id uuid primary key references public.dog_groups (id) on delete cascade,
  winning_dog_entry_id uuid references public.dog_entries (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.dog_best_in_show_results (
  event_id uuid primary key references public.events (id) on delete cascade,
  winning_dog_entry_id uuid references public.dog_entries (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.football_games (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  home_team text not null,
  away_team text not null,
  game_time timestamptz,
  points_value int not null default 1,
  sort_order int not null default 0
);

create index football_games_event_id_idx on public.football_games (event_id);

create table public.football_picks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  participant_id uuid not null references public.profiles (id) on delete cascade,
  game_id uuid not null references public.football_games (id) on delete cascade,
  winner_side text not null check (winner_side in ('home', 'away')),
  updated_at timestamptz not null default now(),
  unique (participant_id, game_id)
);

create index football_picks_event_idx on public.football_picks (event_id);

create table public.football_results (
  game_id uuid primary key references public.football_games (id) on delete cascade,
  winner_side text not null check (winner_side in ('home', 'away')),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Lock helpers (SECURITY DEFINER so RLS on events does not block)
-- -----------------------------------------------------------------------------

create or replace function public.dog_show_is_locked (e_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select dog_show_locked_manual from public.events where id = e_id),
    false
  )
  or coalesce(
    (
      select
        dog_show_lock_at is not null
        and dog_show_lock_at <= now()
      from public.events
      where
        id = e_id
    ),
    false
  );
$$;

create or replace function public.football_is_locked (e_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select football_locked_manual from public.events where id = e_id),
    false
  )
  or coalesce(
    (
      select
        football_lock_at is not null
        and football_lock_at <= now()
      from public.events
      where
        id = e_id
    ),
    false
  );
$$;

grant execute on function public.dog_show_is_locked (uuid) to anon, authenticated;
grant execute on function public.football_is_locked (uuid) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Auto-create profile on first sign-in (anonymous or otherwise)
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', 'Player'))
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users for each row
execute function public.handle_new_user ();

-- -----------------------------------------------------------------------------
-- Leaderboard: SECURITY DEFINER function (stable scoring rules)
-- -----------------------------------------------------------------------------

create or replace function public.leaderboard_for_event (p_event_id uuid)
returns table (
  participant_id uuid,
  display_name text,
  dog_points bigint,
  football_points bigint,
  total_points bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with
    grp as (
      select
        p.participant_id,
        sum(
          case
            when
              r.winning_dog_entry_id is not null
              and p.dog_entry_id is not null
              and p.dog_entry_id = r.winning_dog_entry_id
            then
              g.points_per_correct
            else 0
          end
        )::bigint as pts
      from
        dog_group_picks p
        join dog_groups g on g.id = p.group_id
        left join dog_group_results r on r.group_id = p.group_id
      where
        p.event_id = p_event_id
      group by
        p.participant_id
    ),
    bis as (
      select
        p.participant_id,
        case
          when
            res.winning_dog_entry_id is not null
            and p.dog_entry_id is not null
            and p.dog_entry_id = res.winning_dog_entry_id
          then
            e.best_in_show_points::bigint
          else
            0::bigint
        end as pts
      from
        dog_best_in_show_picks p
        join events e on e.id = p.event_id
        left join dog_best_in_show_results res on res.event_id = p.event_id
      where
        p.event_id = p_event_id
    ),
    fb as (
      select
        p.participant_id,
        sum(
          case
            when
              r.winner_side is not null
              and p.winner_side = r.winner_side
            then
              fg.points_value
            else 0
          end
        )::bigint as pts
      from
        football_picks p
        join football_games fg on fg.id = p.game_id
        left join football_results r on r.game_id = p.game_id
      where
        p.event_id = p_event_id
      group by
        p.participant_id
    )
  select
    ep.user_id as participant_id,
    pr.display_name,
    (coalesce(g.pts, 0) + coalesce(b.pts, 0))::bigint as dog_points,
    coalesce(f.pts, 0)::bigint as football_points,
    (
      coalesce(g.pts, 0) + coalesce(b.pts, 0) + coalesce(f.pts, 0)
    )::bigint as total_points
  from
    event_participants ep
    join profiles pr on pr.id = ep.user_id
    left join grp g on g.participant_id = ep.user_id
    left join bis b on b.participant_id = ep.user_id
    left join fb f on f.participant_id = ep.user_id
  where
    ep.event_id = p_event_id
  order by
    total_points desc,
    display_name asc;
$$;

grant execute on function public.leaderboard_for_event (uuid) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.events enable row level security;
alter table public.event_secrets enable row level security;
alter table public.event_participants enable row level security;
alter table public.profiles enable row level security;
alter table public.dog_groups enable row level security;
alter table public.dog_entries enable row level security;
alter table public.dog_group_picks enable row level security;
alter table public.dog_best_in_show_picks enable row level security;
alter table public.dog_group_results enable row level security;
alter table public.dog_best_in_show_results enable row level security;
alter table public.football_games enable row level security;
alter table public.football_picks enable row level security;
alter table public.football_results enable row level security;

-- Events: readable by any signed-in user
create policy events_select_authenticated
on public.events for select to authenticated
using (true);

create policy event_participants_select
on public.event_participants for select to authenticated
using (true);

create policy event_participants_insert_own
on public.event_participants for insert to authenticated
with check (user_id = (select auth.uid ()));

-- No access to event_secrets for client roles (only service_role bypass)
create policy event_secrets_deny_all
on public.event_secrets for all to authenticated
using (false);

create policy event_secrets_deny_anon
on public.event_secrets for all to anon
using (false);

-- Profiles
create policy profiles_select_all
on public.profiles for select to authenticated
using (true);

create policy profiles_insert_own
on public.profiles for insert to authenticated
with check (id = (select auth.uid ()));

create policy profiles_update_own
on public.profiles for update to authenticated
using (id = (select auth.uid ()))
with check (id = (select auth.uid ()));

-- Dog groups & entries: read if authenticated
create policy dog_groups_select
on public.dog_groups for select to authenticated
using (true);

create policy dog_entries_select
on public.dog_entries for select to authenticated
using (true);

-- Results: read for authenticated
create policy dog_group_results_select
on public.dog_group_results for select to authenticated
using (true);

create policy dog_bis_results_select
on public.dog_best_in_show_results for select to authenticated
using (true);

create policy football_games_select
on public.football_games for select to authenticated
using (true);

create policy football_results_select
on public.football_results for select to authenticated
using (true);

-- Dog group picks: own row always; others only when dog show locked
create policy dog_group_picks_select
on public.dog_group_picks for select to authenticated
using (
  participant_id = (select auth.uid ())
  or public.dog_show_is_locked (event_id)
);

create policy dog_group_picks_insert
on public.dog_group_picks for insert to authenticated
with check (
  participant_id = (select auth.uid ())
  and not public.dog_show_is_locked (event_id)
);

create policy dog_group_picks_update
on public.dog_group_picks for update to authenticated
using (
  participant_id = (select auth.uid ())
  and not public.dog_show_is_locked (event_id)
)
with check (
  participant_id = (select auth.uid ())
  and not public.dog_show_is_locked (event_id)
);

-- BIS picks
create policy dog_bis_picks_select
on public.dog_best_in_show_picks for select to authenticated
using (
  participant_id = (select auth.uid ())
  or public.dog_show_is_locked (event_id)
);

create policy dog_bis_picks_insert
on public.dog_best_in_show_picks for insert to authenticated
with check (
  participant_id = (select auth.uid ())
  and not public.dog_show_is_locked (event_id)
);

create policy dog_bis_picks_update
on public.dog_best_in_show_picks for update to authenticated
using (
  participant_id = (select auth.uid ())
  and not public.dog_show_is_locked (event_id)
)
with check (
  participant_id = (select auth.uid ())
  and not public.dog_show_is_locked (event_id)
);

-- Football picks
create policy football_picks_select
on public.football_picks for select to authenticated
using (
  participant_id = (select auth.uid ())
  or public.football_is_locked (event_id)
);

create policy football_picks_insert
on public.football_picks for insert to authenticated
with check (
  participant_id = (select auth.uid ())
  and not public.football_is_locked (event_id)
);

create policy football_picks_update
on public.football_picks for update to authenticated
using (
  participant_id = (select auth.uid ())
  and not public.football_is_locked (event_id)
)
with check (
  participant_id = (select auth.uid ())
  and not public.football_is_locked (event_id)
);

-- -----------------------------------------------------------------------------
-- Realtime: replicate selected tables
-- -----------------------------------------------------------------------------

alter table public.events replica identity full;
alter table public.dog_groups replica identity full;
alter table public.dog_entries replica identity full;
alter table public.dog_group_picks replica identity full;
alter table public.dog_best_in_show_picks replica identity full;
alter table public.dog_group_results replica identity full;
alter table public.dog_best_in_show_results replica identity full;
alter table public.football_games replica identity full;
alter table public.football_picks replica identity full;
alter table public.football_results replica identity full;
alter table public.event_participants replica identity full;
alter table public.profiles replica identity full;

alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.event_participants;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.dog_groups;
alter publication supabase_realtime add table public.dog_entries;
alter publication supabase_realtime add table public.dog_group_picks;
alter publication supabase_realtime add table public.dog_best_in_show_picks;
alter publication supabase_realtime add table public.dog_group_results;
alter publication supabase_realtime add table public.dog_best_in_show_results;
alter publication supabase_realtime add table public.football_games;
alter publication supabase_realtime add table public.football_picks;
alter publication supabase_realtime add table public.football_results;
