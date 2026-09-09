-- Emoji opcional para representar el tipo de objeto físico (imán,
-- souvenir, foto...) en la lista de Objetos Conectados.
alter table public.nfc_tags add column icon text;
