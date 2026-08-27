-- is_trip_owner(id) vuelve a consultar la propia tabla trips. Cuando se usa
-- en la política de SELECT de trips y esa política se dispara por el
-- RETURNING de un INSERT (p.ej. .insert().select() de supabase-js), la
-- subconsulta interna no ve la fila recién insertada dentro del mismo
-- comando, y el INSERT falla con "new row violates row-level security
-- policy" aunque el usuario sea el dueño. Se reemplaza por una
-- comparación directa de owner_id, que sí ve la fila en curso.
alter policy "trips: select visible" on public.trips
using (
  owner_id = (select auth.uid())
  or private.is_trip_member(id)
  or exists (
    select 1 from public.trip_shares ts
    where ts.trip_id = id and ts.share_mode in ('link','nfc')
  )
);
