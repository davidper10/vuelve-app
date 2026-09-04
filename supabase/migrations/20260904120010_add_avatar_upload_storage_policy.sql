-- Permite subir la foto de perfil a memories/avatars/{auth.uid()}/...
-- La política de subida existente exige que el primer segmento de la
-- ruta sea un trip_id (uuid) válido, así que las rutas de avatar
-- necesitan su propia política explícita.
create policy "memories bucket: upload own avatar"
on storage.objects for insert
with check (
  bucket_id = 'memories'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = (auth.uid())::text
);
