-- Compartir por enlace: el código del enlace pasa a ser un secreto de verdad.
--
-- Antes, cualquier viaje con share_mode 'link'/'nfc' era legible por TODOS
-- (anon incluido) y sin necesidad de conocer el código, y las etiquetas NFC
-- activas eran listables por cualquiera. Ahora las tablas solo las leen el
-- dueño y los miembros; el acceso sin cuenta pasa por funciones que exigen el
-- código exacto.

-- 1) Lectura y escritura solo para dueño / miembros ------------------------
create or replace function private.can_view_trip(trip uuid)
returns boolean
language sql
stable security definer
set search_path to 'public'
as $$
  select private.is_trip_owner(trip) or private.is_trip_member(trip);
$$;

create or replace function private.can_add_to_trip(trip uuid)
returns boolean
language sql
stable security definer
set search_path to 'public'
as $$
  select private.is_trip_owner(trip)
    or exists (
      select 1 from public.trip_members tm
      where tm.trip_id = trip and tm.user_id = auth.uid() and tm.role in ('owner', 'editor')
    );
$$;

alter policy "trips: select visible" on public.trips
  using ((owner_id = (select auth.uid())) or private.is_trip_member(id));

-- Unirse a un viaje ya no se hace insertando directamente: lo hace join_trip().
alter policy "trip_members: insert if owner" on public.trip_members
  with check (private.is_trip_owner(trip_id));

drop policy if exists "nfc: public read active tags by slug" on public.nfc_tags;
create policy "nfc: select own" on public.nfc_tags
  for select using (owner_id = (select auth.uid()));

-- 2) Acceso con código -----------------------------------------------------

-- Vista de un viaje compartido por enlace. Modo 'view': contenido visible para
-- cualquiera. Modo 'collab': solo vista previa (título, portada, contadores)
-- hasta que la persona se une. El diario no se expone nunca por enlace.
create or replace function public.get_shared_trip(p_slug text)
returns jsonb
language plpgsql
stable security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := auth.uid();
  s record;
  t record;
  o record;
  v_role text;
  v_mode text;
  v_content boolean;
  v_moments jsonb := '[]'::jsonb;
  v_moment_count int;
  v_memory_count int;
begin
  select ts.trip_id, ts.allow_add_memories into s
  from public.trip_shares ts
  where ts.public_slug = p_slug and ts.share_mode = 'link';
  if not found then return null; end if;

  select tr.id, tr.owner_id, tr.title, tr.country, tr.cover_photo_url,
         tr.start_date, tr.end_date, tr.destination_summary, tr.quote
    into t from public.trips tr where tr.id = s.trip_id;
  if not found then return null; end if;

  select p.full_name, p.avatar_url into o from public.profiles p where p.id = t.owner_id;

  v_role := case
    when v_uid is not null and t.owner_id = v_uid then 'owner'
    when v_uid is not null and exists (
      select 1 from public.trip_members tm where tm.trip_id = t.id and tm.user_id = v_uid
    ) then 'member'
    else null
  end;
  v_mode := case when s.allow_add_memories then 'collab' else 'view' end;
  v_content := v_mode = 'view' or v_role is not null;

  select count(*) into v_moment_count from public.moments where trip_id = t.id;
  select count(*) into v_memory_count from public.memories where trip_id = t.id;

  if v_content then
    select coalesce(jsonb_agg(x.j order by x.occ nulls last, x.cat), '[]'::jsonb) into v_moments
    from (
      select jsonb_build_object(
               'id', m.id, 'title', m.title, 'story', m.story, 'place_name', m.place_name,
               'occurred_at', m.occurred_at, 'lat', m.lat, 'lng', m.lng,
               'media', coalesce((
                 select jsonb_agg(jsonb_build_object('path', me.storage_path, 'type', me.type) order by me.created_at)
                 from public.moment_memories mm
                 join public.memories me on me.id = mm.memory_id
                 where mm.moment_id = m.id
               ), '[]'::jsonb)
             ) as j,
             m.occurred_at as occ,
             m.created_at as cat
      from public.moments m
      where m.trip_id = t.id
      order by m.occurred_at nulls last, m.created_at
      limit 200
    ) x;
  end if;

  return jsonb_build_object(
    'mode', v_mode,
    'viewer_role', v_role,
    'trip', jsonb_build_object(
      'id', t.id, 'title', t.title, 'country', t.country, 'cover_photo_url', t.cover_photo_url,
      'start_date', t.start_date, 'end_date', t.end_date,
      'destination_summary', t.destination_summary, 'quote', t.quote
    ),
    'owner', jsonb_build_object('full_name', o.full_name, 'avatar_url', o.avatar_url),
    'moment_count', v_moment_count,
    'memory_count', v_memory_count,
    'moments', v_moments
  );
end;
$$;

-- Vista de lo que enlaza un imán NFC activo (un recuerdo o un viaje entero).
-- Tener el enlace del imán equivale a poder verlo, en solo lectura.
create or replace function public.get_shared_nfc(p_slug text)
returns jsonb
language plpgsql
stable security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := auth.uid();
  n record;
  mo record;
  t record;
  o record;
  v_trip_id uuid;
  v_kind text;
  v_role text;
  v_moments jsonb := '[]'::jsonb;
begin
  select nt.id, nt.link_type, nt.trip_id, nt.moment_id into n
  from public.nfc_tags nt
  where nt.public_slug = p_slug and nt.status = 'active';
  if not found then return null; end if;

  if n.link_type = 'moment' and n.moment_id is not null then
    select m.id, m.trip_id into mo from public.moments m where m.id = n.moment_id;
    if not found then return null; end if;
    v_trip_id := mo.trip_id;
    v_kind := 'moment';
  elsif n.trip_id is not null then
    v_trip_id := n.trip_id;
    v_kind := 'trip';
  else
    return jsonb_build_object('kind', 'empty', 'tag_id', n.id);
  end if;

  select tr.id, tr.owner_id, tr.title, tr.country, tr.cover_photo_url,
         tr.start_date, tr.end_date, tr.destination_summary, tr.quote
    into t from public.trips tr where tr.id = v_trip_id;
  if not found then return null; end if;

  select p.full_name, p.avatar_url into o from public.profiles p where p.id = t.owner_id;

  v_role := case
    when v_uid is not null and t.owner_id = v_uid then 'owner'
    when v_uid is not null and exists (
      select 1 from public.trip_members tm where tm.trip_id = t.id and tm.user_id = v_uid
    ) then 'member'
    else null
  end;

  select coalesce(jsonb_agg(x.j order by x.occ nulls last, x.cat), '[]'::jsonb) into v_moments
  from (
    select jsonb_build_object(
             'id', m.id, 'title', m.title, 'story', m.story, 'place_name', m.place_name,
             'occurred_at', m.occurred_at, 'lat', m.lat, 'lng', m.lng,
             'media', coalesce((
               select jsonb_agg(jsonb_build_object('path', me.storage_path, 'type', me.type) order by me.created_at)
               from public.moment_memories mm
               join public.memories me on me.id = mm.memory_id
               where mm.moment_id = m.id
             ), '[]'::jsonb)
           ) as j,
           m.occurred_at as occ,
           m.created_at as cat
    from public.moments m
    where m.trip_id = t.id
      and (v_kind = 'trip' or m.id = n.moment_id)
    order by m.occurred_at nulls last, m.created_at
    limit 200
  ) x;

  return jsonb_build_object(
    'mode', 'nfc',
    'kind', v_kind,
    'tag_id', n.id,
    'viewer_role', v_role,
    'trip', jsonb_build_object(
      'id', t.id, 'title', t.title, 'country', t.country, 'cover_photo_url', t.cover_photo_url,
      'start_date', t.start_date, 'end_date', t.end_date,
      'destination_summary', t.destination_summary, 'quote', t.quote
    ),
    'owner', jsonb_build_object('full_name', o.full_name, 'avatar_url', o.avatar_url),
    'moments', v_moments
  );
end;
$$;

-- Unirse como colaborador con el código del enlace. El límite de personas del
-- plan gratuito (2) replica FREE_COLLABORATOR_LIMIT de lib/limits.ts.
create or replace function public.join_trip(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := auth.uid();
  s record;
  t record;
  v_premium boolean;
  v_members int;
begin
  if v_uid is null then
    return jsonb_build_object('error', 'auth');
  end if;

  select ts.trip_id, ts.allow_add_memories into s
  from public.trip_shares ts
  where ts.public_slug = p_slug and ts.share_mode = 'link';
  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;

  select tr.id, tr.owner_id into t from public.trips tr where tr.id = s.trip_id;
  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;

  if t.owner_id = v_uid or exists (
    select 1 from public.trip_members tm where tm.trip_id = t.id and tm.user_id = v_uid
  ) then
    return jsonb_build_object('trip_id', t.id, 'joined', false);
  end if;

  if not s.allow_add_memories then
    return jsonb_build_object('error', 'view_only');
  end if;

  select coalesce(p.is_premium, false) into v_premium from public.profiles p where p.id = t.owner_id;
  select count(*) into v_members from public.trip_members where trip_id = t.id;
  if not v_premium and 1 + v_members >= 2 then
    return jsonb_build_object('error', 'full');
  end if;

  insert into public.trip_members (trip_id, user_id, role) values (t.id, v_uid, 'editor');
  return jsonb_build_object('trip_id', t.id, 'joined', true);
end;
$$;

revoke all on function public.get_shared_trip(text) from public;
revoke all on function public.get_shared_nfc(text) from public;
revoke all on function public.join_trip(text) from public;
grant execute on function public.get_shared_trip(text) to anon, authenticated;
grant execute on function public.get_shared_nfc(text) to anon, authenticated;
grant execute on function public.join_trip(text) to authenticated;

-- Solo usuarios con sesión pueden unirse (Supabase da execute a anon por defecto).
revoke execute on function public.join_trip(text) from anon;
