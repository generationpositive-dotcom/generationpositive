-- ============================================================
-- Génération Positive — Schéma de base de données
-- Tables, RLS, rôles admin, fonctions de sécurité, buckets
-- ============================================================

-- ---------- ENUMS ----------
create type public.admin_role as enum ('super_admin', 'content_editor', 'resource_manager');
create type public.application_status as enum ('pending', 'approved', 'rejected');

-- ---------- TABLES ----------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role public.admin_role not null,
  created_at timestamptz not null default now()
);

create table public.membership_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  message text,
  status public.application_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  published boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  title text,
  file_path text not null,
  media_type text not null check (media_type in ('image', 'video')),
  caption text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_path text not null,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role_title text not null,
  photo_path text,
  bio text,
  display_order int not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- ROW LEVEL SECURITY ----------
alter table public.profiles enable row level security;
alter table public.membership_applications enable row level security;
alter table public.announcements enable row level security;
alter table public.media enable row level security;
alter table public.documents enable row level security;
alter table public.team_members enable row level security;

-- ---------- SECURITY DEFINER FUNCTIONS ----------

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin');
$$;
revoke all on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to authenticated;

create or replace function public.current_role_is(target_role public.admin_role)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = target_role);
$$;
revoke all on function public.current_role_is(public.admin_role) from public;
grant execute on function public.current_role_is(public.admin_role) to authenticated;

create or replace function public.get_admin_connections()
returns table(id uuid, email text, full_name text, role public.admin_role, last_sign_in_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select p.id, p.email, p.full_name, p.role, u.last_sign_in_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_super_admin();
$$;
revoke all on function public.get_admin_connections() from public;
grant execute on function public.get_admin_connections() to authenticated;

-- ---------- POLICIES: profiles ----------
create policy "admins can read profiles" on public.profiles
  for select to authenticated using (public.is_admin());
create policy "super_admin can manage profiles" on public.profiles
  for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------- POLICIES: membership_applications ----------
create policy "anyone can submit membership application" on public.membership_applications
  for insert to anon, authenticated with check (true);
create policy "super_admin can manage membership applications" on public.membership_applications
  for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------- POLICIES: announcements ----------
create policy "public can read published announcements" on public.announcements
  for select to anon, authenticated using (published = true or public.is_admin());
create policy "super_admin or content_editor can manage announcements" on public.announcements
  for insert to authenticated with check (public.is_super_admin() or public.current_role_is('content_editor'));
create policy "super_admin or content_editor can update announcements" on public.announcements
  for update to authenticated using (public.is_super_admin() or public.current_role_is('content_editor'))
  with check (public.is_super_admin() or public.current_role_is('content_editor'));
create policy "super_admin or content_editor can delete announcements" on public.announcements
  for delete to authenticated using (public.is_super_admin() or public.current_role_is('content_editor'));

-- ---------- POLICIES: media ----------
create policy "public can read media" on public.media
  for select to anon, authenticated using (true);
create policy "super_admin or content_editor can manage media" on public.media
  for insert to authenticated with check (public.is_super_admin() or public.current_role_is('content_editor'));
create policy "super_admin or content_editor can update media" on public.media
  for update to authenticated using (public.is_super_admin() or public.current_role_is('content_editor'))
  with check (public.is_super_admin() or public.current_role_is('content_editor'));
create policy "super_admin or content_editor can delete media" on public.media
  for delete to authenticated using (public.is_super_admin() or public.current_role_is('content_editor'));

-- ---------- POLICIES: documents ----------
create policy "public can read documents" on public.documents
  for select to anon, authenticated using (true);
create policy "super_admin or resource_manager can manage documents" on public.documents
  for insert to authenticated with check (public.is_super_admin() or public.current_role_is('resource_manager'));
create policy "super_admin or resource_manager can update documents" on public.documents
  for update to authenticated using (public.is_super_admin() or public.current_role_is('resource_manager'))
  with check (public.is_super_admin() or public.current_role_is('resource_manager'));
create policy "super_admin or resource_manager can delete documents" on public.documents
  for delete to authenticated using (public.is_super_admin() or public.current_role_is('resource_manager'));

-- ---------- POLICIES: team_members ----------
create policy "public can read team_members" on public.team_members
  for select to anon, authenticated using (true);
create policy "super_admin or content_editor can manage team_members" on public.team_members
  for insert to authenticated with check (public.is_super_admin() or public.current_role_is('content_editor'));
create policy "super_admin or content_editor can update team_members" on public.team_members
  for update to authenticated using (public.is_super_admin() or public.current_role_is('content_editor'))
  with check (public.is_super_admin() or public.current_role_is('content_editor'));
create policy "super_admin or content_editor can delete team_members" on public.team_members
  for delete to authenticated using (public.is_super_admin() or public.current_role_is('content_editor'));

-- ---------- STORAGE BUCKETS ----------
insert into storage.buckets (id, name, public) values ('media', 'media', true);
insert into storage.buckets (id, name, public) values ('documents', 'documents', true);

create policy "public can read media bucket" on storage.objects
  for select to anon, authenticated using (bucket_id = 'media');
create policy "super_admin or content_editor can write media bucket" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and (public.is_super_admin() or public.current_role_is('content_editor')));
create policy "super_admin or content_editor can update media bucket" on storage.objects
  for update to authenticated using (bucket_id = 'media' and (public.is_super_admin() or public.current_role_is('content_editor')));
create policy "super_admin or content_editor can delete media bucket" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and (public.is_super_admin() or public.current_role_is('content_editor')));

create policy "public can read documents bucket" on storage.objects
  for select to anon, authenticated using (bucket_id = 'documents');
create policy "super_admin or resource_manager can write documents bucket" on storage.objects
  for insert to authenticated with check (bucket_id = 'documents' and (public.is_super_admin() or public.current_role_is('resource_manager')));
create policy "super_admin or resource_manager can update documents bucket" on storage.objects
  for update to authenticated using (bucket_id = 'documents' and (public.is_super_admin() or public.current_role_is('resource_manager')));
create policy "super_admin or resource_manager can delete documents bucket" on storage.objects
  for delete to authenticated using (bucket_id = 'documents' and (public.is_super_admin() or public.current_role_is('resource_manager')));
