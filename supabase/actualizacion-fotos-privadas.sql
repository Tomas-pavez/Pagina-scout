-- Actualización (noviembre 2026): fotos de álbumes y archivos de comunicaciones privados.
-- Ejecútalo una vez en Supabase → SQL Editor. Se puede ejecutar más de una vez sin problema.

-- Bucket público "media": solo los administradores pueden listar sus archivos.
drop policy if exists "media lectura" on storage.objects;
drop policy if exists "media listar admin" on storage.objects;
create policy "media listar admin" on storage.objects for select using (bucket_id = 'media' and public.is_admin());

-- Bucket privado "privado": solo miembros aprobados pueden ver; solo administradores suben o borran.
insert into storage.buckets (id, name, public) values ('privado', 'privado', false)
  on conflict (id) do update set public = false;
drop policy if exists "privado ver" on storage.objects;
create policy "privado ver" on storage.objects for select using (bucket_id = 'privado' and public.is_member());
drop policy if exists "privado subir" on storage.objects;
create policy "privado subir" on storage.objects for insert with check (bucket_id = 'privado' and public.is_admin());
drop policy if exists "privado editar" on storage.objects;
create policy "privado editar" on storage.objects for update using (bucket_id = 'privado' and public.is_admin());
drop policy if exists "privado eliminar" on storage.objects;
create policy "privado eliminar" on storage.objects for delete using (bucket_id = 'privado' and public.is_admin());
