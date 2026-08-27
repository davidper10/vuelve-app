-- ============================================================
-- Vuelve — esquema inicial
-- Viajes, recuerdos, momentos, diario, NFC y compartición
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- trips ----------
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  country text,
  destination_summary text,
  cover_photo_url text,
  quote text,
  start_date date,
  end_date date,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trips_owner_id_idx on public.trips (owner_id);

create function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trips_set_updated_at
  before update on public.trips
  for each row execute procedure public.set_updated_at();

-- ---------- trip_members (viajes colaborativos) ----------
create table public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  invited_email text,
  role text not null default 'editor' check (role in ('owner','editor','viewer')),
  joined_at timestamptz not null default now(),
  unique (trip_id, user_id)
);

create index trip_members_user_id_idx on public.trip_members (user_id);

-- ---------- trip_shares (compartir viaje) ----------
create table public.trip_shares (
  trip_id uuid primary key references public.trips(id) on delete cascade,
  share_mode text not null default 'private' check (share_mode in ('private','invited','nfc','link')),
  allow_add_memories boolean not null default false,
  public_slug text unique,
  updated_at timestamptz not null default now()
);

-- ---------- helper: ¿puede este usuario ver/editar el viaje? ----------
create function public.is_trip_owner(trip uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.trips t where t.id = trip and t.owner_id = auth.uid());
$$;

create function public.is_trip_member(trip uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.trip_members tm where tm.trip_id = trip and tm.user_id = auth.uid());
$$;

create function public.can_view_trip(trip uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_trip_owner(trip)
    or public.is_trip_member(trip)
    or exists (
      select 1 from public.trip_shares ts
      where ts.trip_id = trip and ts.share_mode in ('link','nfc')
    );
$$;

create function public.can_add_to_trip(trip uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_trip_owner(trip)
    or exists (
      select 1 from public.trip_members tm
      where tm.trip_id = trip and tm.user_id = auth.uid() and tm.role in ('owner','editor')
    )
    or exists (
      select 1 from public.trip_shares ts
      where ts.trip_id = trip and ts.allow_add_memories = true and ts.share_mode in ('invited','link','nfc')
    );
$$;

-- ---------- memories (fotos / vídeos / audios sueltos) ----------
create table public.memories (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  type text not null check (type in ('photo','video','audio')),
  storage_path text not null,
  taken_at timestamptz,
  day_label date,
  place_name text,
  lat double precision,
  lng double precision,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index memories_trip_id_idx on public.memories (trip_id);

-- ---------- moments (momentos narrativos) ----------
create table public.moments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null,
  story text,
  place_name text,
  lat double precision,
  lng double precision,
  occurred_at timestamptz,
  song_title text,
  song_url text,
  is_favorite boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index moments_trip_id_idx on public.moments (trip_id);

create table public.moment_memories (
  moment_id uuid not null references public.moments(id) on delete cascade,
  memory_id uuid not null references public.memories(id) on delete cascade,
  primary key (moment_id, memory_id)
);

-- ---------- diary_entries (diario) ----------
create table public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  entry_date date not null,
  body text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index diary_entries_trip_id_idx on public.diary_entries (trip_id);

-- ---------- nfc_tags ----------
create table public.nfc_tags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  tag_uid text unique,
  link_type text not null check (link_type in ('trip','moment','album','selection','video')),
  trip_id uuid references public.trips(id) on delete set null,
  moment_id uuid references public.moments(id) on delete set null,
  public_slug text not null unique,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

create index nfc_tags_owner_id_idx on public.nfc_tags (owner_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_shares enable row level security;
alter table public.memories enable row level security;
alter table public.moments enable row level security;
alter table public.moment_memories enable row level security;
alter table public.diary_entries enable row level security;
alter table public.nfc_tags enable row level security;

-- profiles
create policy "profiles: select own" on public.profiles for select using (id = auth.uid());
create policy "profiles: update own" on public.profiles for update using (id = auth.uid());

-- trips
create policy "trips: select visible" on public.trips for select using (public.can_view_trip(id));
create policy "trips: insert own" on public.trips for insert with check (owner_id = auth.uid());
create policy "trips: update own" on public.trips for update using (owner_id = auth.uid());
create policy "trips: delete own" on public.trips for delete using (owner_id = auth.uid());

-- trip_members
create policy "trip_members: select if can view trip" on public.trip_members for select using (public.can_view_trip(trip_id));
create policy "trip_members: manage if owner" on public.trip_members for all using (public.is_trip_owner(trip_id)) with check (public.is_trip_owner(trip_id));

-- trip_shares
create policy "trip_shares: select if can view trip" on public.trip_shares for select using (public.can_view_trip(trip_id));
create policy "trip_shares: manage if owner" on public.trip_shares for all using (public.is_trip_owner(trip_id)) with check (public.is_trip_owner(trip_id));

-- memories
create policy "memories: select if can view trip" on public.memories for select using (public.can_view_trip(trip_id));
create policy "memories: insert if can add" on public.memories for insert with check (public.can_add_to_trip(trip_id));
create policy "memories: update own or owner" on public.memories for update using (created_by = auth.uid() or public.is_trip_owner(trip_id));
create policy "memories: delete own or owner" on public.memories for delete using (created_by = auth.uid() or public.is_trip_owner(trip_id));

-- moments
create policy "moments: select if can view trip" on public.moments for select using (public.can_view_trip(trip_id));
create policy "moments: insert if can add" on public.moments for insert with check (public.can_add_to_trip(trip_id));
create policy "moments: update own or owner" on public.moments for update using (created_by = auth.uid() or public.is_trip_owner(trip_id));
create policy "moments: delete own or owner" on public.moments for delete using (created_by = auth.uid() or public.is_trip_owner(trip_id));

-- moment_memories
create policy "moment_memories: select if can view parent moment" on public.moment_memories for select using (
  exists (select 1 from public.moments m where m.id = moment_id and public.can_view_trip(m.trip_id))
);
create policy "moment_memories: manage if can add to parent moment" on public.moment_memories for all using (
  exists (select 1 from public.moments m where m.id = moment_id and public.can_add_to_trip(m.trip_id))
) with check (
  exists (select 1 from public.moments m where m.id = moment_id and public.can_add_to_trip(m.trip_id))
);

-- diary_entries
create policy "diary: select if can view trip" on public.diary_entries for select using (public.can_view_trip(trip_id));
create policy "diary: insert if can add" on public.diary_entries for insert with check (public.can_add_to_trip(trip_id));
create policy "diary: update own or owner" on public.diary_entries for update using (created_by = auth.uid() or public.is_trip_owner(trip_id));
create policy "diary: delete own or owner" on public.diary_entries for delete using (created_by = auth.uid() or public.is_trip_owner(trip_id));

-- nfc_tags
create policy "nfc: owner full access" on public.nfc_tags for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "nfc: public read active tags by slug" on public.nfc_tags for select using (status = 'active');

-- ============================================================
-- Storage: bucket para fotos / vídeos / audios de recuerdos
-- Convención de ruta: {trip_id}/{filename}
-- ============================================================

insert into storage.buckets (id, name, public)
values ('memories', 'memories', true)
on conflict (id) do nothing;

create policy "memories bucket: public read"
  on storage.objects for select
  using (bucket_id = 'memories');

create policy "memories bucket: upload if can add to trip"
  on storage.objects for insert
  with check (
    bucket_id = 'memories'
    and public.can_add_to_trip(((storage.foldername(name))[1])::uuid)
  );

create policy "memories bucket: delete own uploads or trip owner"
  on storage.objects for delete
  using (
    bucket_id = 'memories'
    and (owner = auth.uid() or public.is_trip_owner(((storage.foldername(name))[1])::uuid))
  );
