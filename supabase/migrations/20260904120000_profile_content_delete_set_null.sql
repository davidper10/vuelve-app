-- Al borrar una cuenta se borra en cascada todo lo que el usuario POSEE
-- (sus viajes propios y su contenido). Pero si colaboró en un viaje AJENO
-- (creó un recuerdo/momento/diario ahí), esas filas no deben borrarse
-- solas -- pertenecen al viaje de otra persona. Antes, esas FKs eran
-- NO ACTION, lo que hacía fallar el borrado entero de la cuenta si el
-- usuario había colaborado en algún viaje ajeno. Con SET NULL, el
-- contenido se queda (anónimo) y el borrado de cuenta no se bloquea.
alter table public.memories drop constraint memories_created_by_fkey,
  add constraint memories_created_by_fkey foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.moments drop constraint moments_created_by_fkey,
  add constraint moments_created_by_fkey foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.diary_entries drop constraint diary_entries_created_by_fkey,
  add constraint diary_entries_created_by_fkey foreign key (created_by) references public.profiles(id) on delete set null;
