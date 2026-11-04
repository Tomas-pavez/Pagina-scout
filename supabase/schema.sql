-- Esquema para usar el sitio con Supabase (datos compartidos entre todos los visitantes).
-- Ejecútalo una vez en Supabase → SQL Editor.

-- 1) Perfiles y roles -------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  name text,
  role text not null default 'pending' check (role in ('pending', 'member', 'admin')),
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;
create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('member', 'admin'));
$$;

-- La primera cuenta registrada queda como administradora; las demás, pendientes.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', new.email),
          case when exists (select 1 from profiles) then 'pending' else 'admin' end);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

drop policy if exists "perfil propio o admin" on profiles;
create policy "perfil propio o admin" on profiles for select using (id = auth.uid() or is_admin());
drop policy if exists "admin cambia roles" on profiles;
create policy "admin cambia roles" on profiles for update using (is_admin());

-- 2) Registros (cada fila = un registro independiente) ----------------------
create table if not exists public.records (
  collection text not null,
  id text not null,
  data jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (collection, id)
);
alter table public.records enable row level security;

drop policy if exists "lectura" on records;
create policy "lectura" on records for select using (
  collection in ('ramas', 'members', 'faqs', 'settings')
  or (collection in ('events', 'albums', 'photos') and is_member())
  or (collection = 'comms' and (is_admin() or (is_member() and data->>'status' = 'published')))
  or (collection = 'messages' and is_admin())
);
drop policy if exists "crear" on records;
create policy "crear" on records for insert with check (collection = 'messages' or is_admin());
drop policy if exists "editar" on records;
create policy "editar" on records for update using (is_admin());
drop policy if exists "eliminar" on records;
create policy "eliminar" on records for delete using (is_admin());

-- 3) Archivos (fotos, imágenes, documentos) ---------------------------------
insert into storage.buckets (id, name, public) values ('media', 'media', true)
  on conflict (id) do nothing;
drop policy if exists "media lectura" on storage.objects;
create policy "media lectura" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "media subir" on storage.objects;
create policy "media subir" on storage.objects for insert with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media editar" on storage.objects;
create policy "media editar" on storage.objects for update using (bucket_id = 'media' and public.is_admin());
drop policy if exists "media eliminar" on storage.objects;
create policy "media eliminar" on storage.objects for delete using (bucket_id = 'media' and public.is_admin());

-- 4) Datos iniciales ---------------------------------------------------------
insert into records (collection, id, data) values
  ('settings', 'site', '{"id":"site","address":"Las Condes, Santiago de Chile","schedule":"Sábados de 15:00 a 19:00 hrs.","instagram":"https://www.instagram.com/","facebook":"https://www.facebook.com/","email":"contacto@scoutsalcazar.cl","videoUrl":""}'),
  ('faqs', 'faq-1', '{"id":"faq-1","order":1,"active":true,"q":"¿Desde qué edad pueden participar?","a":"Recibimos niñas, niños y jóvenes desde los 7 hasta los 19 años."}'),
  ('faqs', 'faq-2', '{"id":"faq-2","order":2,"active":true,"q":"¿Cuándo y dónde se realizan las actividades?","a":"Nos reunimos los sábados en la tarde en nuestra sede en Las Condes."}'),
  ('faqs', 'faq-3', '{"id":"faq-3","order":3,"active":true,"q":"¿Cómo puedo inscribir a mi hijo o hija?","a":"Escríbenos desde la página de Contacto eligiendo el motivo \"Quiero inscribirme\"."}')
on conflict do nothing;
