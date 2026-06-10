-- Tipos y tablas base para Club Plaza

create type user_role as enum ('comun', 'admin', 'local');

-- Locales del shopping
create table public.locales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  piso text,
  logo_url text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Perfil extendido de auth.users
create table public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  nombre text not null,
  apellido text not null,
  rol user_role not null default 'comun',
  local_id uuid references public.locales (id) on delete set null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint usuarios_local_role_check check (
    (rol = 'local' and local_id is not null)
    or (rol <> 'local')
  )
);

-- Promos de cada local
create table public.promos (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locales (id) on delete cascade,
  titulo text not null,
  descripcion text,
  descuento text,
  fecha_inicio date,
  fecha_fin date,
  imagen_url text,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger usuarios_set_updated_at
before update on public.usuarios
for each row execute function public.set_updated_at();

create trigger locales_set_updated_at
before update on public.locales
for each row execute function public.set_updated_at();

create trigger promos_set_updated_at
before update on public.promos
for each row execute function public.set_updated_at();

-- El perfil en public.usuarios lo crea el backend al registrar usuarios

-- Índices
create index usuarios_rol_idx on public.usuarios (rol);
create index usuarios_local_id_idx on public.usuarios (local_id);
create index promos_local_id_idx on public.promos (local_id);
create index promos_activa_idx on public.promos (activa);

-- RLS
alter table public.usuarios enable row level security;
alter table public.locales enable row level security;
alter table public.promos enable row level security;

-- Políticas básicas (el backend usa service role; esto protege acceso directo desde el cliente)
create policy "Usuarios leen su propio perfil"
on public.usuarios for select
using (auth.uid() = id);

create policy "Locales activos visibles para todos autenticados"
on public.locales for select
using (auth.role() = 'authenticated' and activo = true);

create policy "Promos activas visibles para todos autenticados"
on public.promos for select
using (auth.role() = 'authenticated' and activa = true);
