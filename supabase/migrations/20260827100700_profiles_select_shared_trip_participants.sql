-- profiles solo permitía ver el propio perfil (SELECT), lo que dejaba en
-- blanco nombres/avatares de otras personas en cualquier vista compartida
-- (colaboradores de un viaje, autor de una nota de diario). Se añade una
-- política SELECT adicional (permisiva, se combina con "select own" vía OR):
-- puedes ver el perfil de alguien si es propietario o miembro de un viaje
-- que tú también puedes ver.
create policy "profiles: select shared trip participants"
on public.profiles for select
using (
  exists (
    select 1 from public.trips t
    where t.owner_id = profiles.id and private.can_view_trip(t.id)
  )
  or exists (
    select 1 from public.trip_members tm
    where tm.user_id = profiles.id and private.can_view_trip(tm.trip_id)
  )
);
