-- El bucket `memories` es público (las fotos se sirven por URL directa), pero
-- la política "public read" permitía además LISTAR todos los archivos a
-- cualquiera con la clave anónima. Se sustituye por una política que solo
-- permite listar a usuarios autenticados que pueden ver el viaje (y a cada
-- usuario sus propios avatares). Las URLs públicas siguen funcionando.
drop policy if exists "memories bucket: public read" on storage.objects;

create policy "memories bucket: members can read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'memories'
    and case
      when (storage.foldername(name))[1] = 'avatars'
        then (storage.foldername(name))[2] = (select auth.uid())::text
      when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then private.can_view_trip(((storage.foldername(name))[1])::uuid)
      else false
    end
  );
