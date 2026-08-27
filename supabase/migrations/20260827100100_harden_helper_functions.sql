-- Mueve las funciones auxiliares de permisos a un esquema no expuesto por la API
-- (evita que /rest/v1/rpc/... las exponga públicamente) y fija search_path.

create schema if not exists private;

create function private.is_trip_owner(trip uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.trips t where t.id = trip and t.owner_id = auth.uid());
$$;

create function private.is_trip_member(trip uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.trip_members tm where tm.trip_id = trip and tm.user_id = auth.uid());
$$;

create function private.can_view_trip(trip uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select private.is_trip_owner(trip)
    or private.is_trip_member(trip)
    or exists (
      select 1 from public.trip_shares ts
      where ts.trip_id = trip and ts.share_mode in ('link','nfc')
    );
$$;

create function private.can_add_to_trip(trip uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select private.is_trip_owner(trip)
    or exists (
      select 1 from public.trip_members tm
      where tm.trip_id = trip and tm.user_id = auth.uid() and tm.role in ('owner','editor')
    )
    or exists (
      select 1 from public.trip_shares ts
      where ts.trip_id = trip and ts.allow_add_memories = true and ts.share_mode in ('invited','link','nfc')
    );
$$;

-- repunta las políticas a las nuevas funciones privadas
alter policy "trips: select visible" on public.trips using (private.can_view_trip(id));

alter policy "trip_members: select if can view trip" on public.trip_members using (private.can_view_trip(trip_id));
alter policy "trip_members: manage if owner" on public.trip_members using (private.is_trip_owner(trip_id)) with check (private.is_trip_owner(trip_id));

alter policy "trip_shares: select if can view trip" on public.trip_shares using (private.can_view_trip(trip_id));
alter policy "trip_shares: manage if owner" on public.trip_shares using (private.is_trip_owner(trip_id)) with check (private.is_trip_owner(trip_id));

alter policy "memories: select if can view trip" on public.memories using (private.can_view_trip(trip_id));
alter policy "memories: insert if can add" on public.memories with check (private.can_add_to_trip(trip_id));
alter policy "memories: update own or owner" on public.memories using (created_by = auth.uid() or private.is_trip_owner(trip_id));
alter policy "memories: delete own or owner" on public.memories using (created_by = auth.uid() or private.is_trip_owner(trip_id));

alter policy "moments: select if can view trip" on public.moments using (private.can_view_trip(trip_id));
alter policy "moments: insert if can add" on public.moments with check (private.can_add_to_trip(trip_id));
alter policy "moments: update own or owner" on public.moments using (created_by = auth.uid() or private.is_trip_owner(trip_id));
alter policy "moments: delete own or owner" on public.moments using (created_by = auth.uid() or private.is_trip_owner(trip_id));

alter policy "moment_memories: select if can view parent moment" on public.moment_memories using (
  exists (select 1 from public.moments m where m.id = moment_id and private.can_view_trip(m.trip_id))
);
alter policy "moment_memories: manage if can add to parent moment" on public.moment_memories using (
  exists (select 1 from public.moments m where m.id = moment_id and private.can_add_to_trip(m.trip_id))
) with check (
  exists (select 1 from public.moments m where m.id = moment_id and private.can_add_to_trip(m.trip_id))
);

alter policy "diary: select if can view trip" on public.diary_entries using (private.can_view_trip(trip_id));
alter policy "diary: insert if can add" on public.diary_entries with check (private.can_add_to_trip(trip_id));
alter policy "diary: update own or owner" on public.diary_entries using (created_by = auth.uid() or private.is_trip_owner(trip_id));
alter policy "diary: delete own or owner" on public.diary_entries using (created_by = auth.uid() or private.is_trip_owner(trip_id));

alter policy "memories bucket: upload if can add to trip" on storage.objects with check (
  bucket_id = 'memories' and private.can_add_to_trip(((storage.foldername(name))[1])::uuid)
);
alter policy "memories bucket: delete own uploads or trip owner" on storage.objects using (
  bucket_id = 'memories' and (owner = auth.uid() or private.is_trip_owner(((storage.foldername(name))[1])::uuid))
);

-- ya no se usan: las versiones públicas quedan sin referencias, se eliminan
drop function public.can_add_to_trip(uuid);
drop function public.can_view_trip(uuid);
drop function public.is_trip_member(uuid);
drop function public.is_trip_owner(uuid);

-- corrige el search_path mutable de set_updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
