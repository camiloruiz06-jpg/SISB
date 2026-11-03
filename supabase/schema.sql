-- ===========================================================
-- SISB — Esquema de la base de datos (Supabase / PostgreSQL)
--
-- Cómo usarlo: en Supabase abre "SQL Editor", pega TODO este
-- archivo y dale "Run". Se puede correr varias veces: borra y
-- vuelve a crear todo (¡también borra los datos!).
--
-- Contiene:
--   1. Tablas (usuarios, especialidades, citas, historia_clinica,
--      tramites, formulas)
--   2. Índices y reglas de integridad (R.1-6, R.3-5)
--   3. Seguridad por fila (RLS): cada rol ve solo lo que le toca (R.2-4)
--   4. Bucket privado de Storage para exámenes y documentos (R.8-5)
--
-- Las contraseñas NO se guardan aquí: las maneja Supabase Auth
-- cifradas (R.1-5). Cada usuario inicia sesión con el correo
-- interno  <documento>@sisb.local  y su contraseña.
-- ===========================================================

drop table if exists public.formulas cascade;
drop table if exists public.tramites cascade;
drop table if exists public.historia_clinica cascade;
drop table if exists public.citas cascade;
drop table if exists public.usuarios cascade;
drop table if exists public.especialidades cascade;

-- -----------------------------------------------------------
-- 1. Tablas
-- -----------------------------------------------------------

create table public.especialidades (
  id          text primary key default gen_random_uuid()::text,
  nombre      text not null unique,
  descripcion text not null default '',
  icono       text not null default 'pulso',
  creado_en   timestamptz not null default now()
);

create table public.usuarios (
  id         text primary key default gen_random_uuid()::text,
  auth_id    uuid unique references auth.users (id) on delete set null,
  rol        text not null check (rol in ('paciente', 'medico', 'auxiliar', 'admin')),
  doc        text not null unique,               -- R.1-6: sin documentos duplicados
  nombre     text not null,
  titulo     text,                               -- 'Dr.' / 'Dra.' (médicos)
  nac        date,
  tel        text,
  municipio  text,
  vereda     text,
  eps        text,
  puesto     text,                               -- puesto de salud (pacientes y auxiliares)
  cargo      text,                               -- administradores
  esp_id     text references public.especialidades (id) on delete restrict,
  registro   text,                               -- registro médico
  horario    jsonb,                              -- { duracion, dias: { 1: { manana, tarde } } }
  activo     boolean not null default true,
  creado_en  timestamptz not null default now(),
  constraint medico_con_especialidad check (rol <> 'medico' or esp_id is not null)
);

create table public.citas (
  id          text primary key default gen_random_uuid()::text,
  paciente_id text not null references public.usuarios (id) on delete cascade,
  medico_id   text not null references public.usuarios (id) on delete cascade,
  esp_id      text not null references public.especialidades (id),
  fecha       date not null,
  hora        text not null check (hora ~ '^[0-2][0-9]:[0-5][0-9]$'),  -- '07:20'
  motivo      text not null default '',
  estado      text not null default 'programada'
              check (estado in ('programada', 'atendida', 'no-asistio', 'cancelada')),
  modo        text not null default 'videollamada',
  diagnostico text,
  notas       text,
  creado_en   timestamptz not null default now()
);

create table public.historia_clinica (
  id           text primary key default gen_random_uuid()::text,
  paciente_id  text not null references public.usuarios (id) on delete cascade,
  fecha        date not null default current_date,
  tipo         text not null check (tipo in ('consulta', 'resultado', 'documento')),
  titulo       text not null,
  autor        text not null default '',
  detalle      text not null default '',
  archivo      text,                             -- nombre que ve el usuario
  archivo_ruta text,                             -- ruta dentro del bucket "documentos"
  creado_en    timestamptz not null default now()
);

create table public.tramites (
  id          text primary key default gen_random_uuid()::text,
  paciente_id text not null references public.usuarios (id) on delete cascade,
  titulo      text not null,
  detalle     text not null default '',
  estado      text not null default 'pendiente' check (estado in ('pendiente', 'listo')),
  fecha       date not null default current_date
);

create table public.formulas (
  id          text primary key default gen_random_uuid()::text,
  paciente_id text not null references public.usuarios (id) on delete cascade,
  fecha       date not null default current_date,
  autor       text not null default '',
  items       text[] not null default '{}'
);

-- -----------------------------------------------------------
-- 2. Índices y reglas de integridad
-- -----------------------------------------------------------

-- R.3-5: un médico no puede tener dos citas activas en el mismo turno.
create unique index citas_turno_unico on public.citas (medico_id, fecha, hora) where estado <> 'cancelada';

create index citas_por_paciente    on public.citas (paciente_id, fecha);
create index citas_por_medico_dia  on public.citas (medico_id, fecha);
create index historia_por_paciente on public.historia_clinica (paciente_id, fecha desc);
create index tramites_por_paciente on public.tramites (paciente_id);
create index formulas_por_paciente on public.formulas (paciente_id);
create index usuarios_por_rol      on public.usuarios (rol);
create index usuarios_por_puesto   on public.usuarios (puesto);

-- -----------------------------------------------------------
-- 3. Seguridad por fila (RLS)
-- -----------------------------------------------------------

-- Funciones auxiliares. "security definer" evita que las políticas de
-- usuarios se llamen a sí mismas en bucle.
create or replace function public.mi_usuario_id() returns text
  language sql stable security definer set search_path = public
  as $$ select id from public.usuarios where auth_id = auth.uid() and activo $$;

create or replace function public.mi_rol() returns text
  language sql stable security definer set search_path = public
  as $$ select rol from public.usuarios where auth_id = auth.uid() and activo $$;

create or replace function public.es_personal() returns boolean
  language sql stable security definer set search_path = public
  as $$ select coalesce(public.mi_rol() in ('medico', 'auxiliar', 'admin'), false) $$;

-- Un usuario que no es administrador no puede cambiarse el rol ni la cuenta.
create or replace function public.proteger_usuario() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if coalesce(public.mi_rol(), '') <> 'admin' and auth.role() <> 'service_role' then
    new.rol     := old.rol;
    new.auth_id := old.auth_id;
    new.activo  := old.activo;
  end if;
  return new;
end $$;

create trigger usuarios_proteger before update on public.usuarios
  for each row execute function public.proteger_usuario();

-- Turnos ocupados de un médico, SIN datos del paciente. Lo usa el paciente
-- al agendar, porque por seguridad no puede ver las citas de otras personas.
create or replace function public.turnos_ocupados(desde date, hasta date)
  returns table (medico_id text, fecha date, hora text)
  language sql stable security definer set search_path = public as $$
    select c.medico_id, c.fecha, c.hora from public.citas c
    where c.estado <> 'cancelada' and c.fecha between desde and hasta
$$;
revoke execute on function public.turnos_ocupados(date, date) from public, anon;
grant  execute on function public.turnos_ocupados(date, date) to authenticated;

alter table public.especialidades   enable row level security;
alter table public.usuarios         enable row level security;
alter table public.citas            enable row level security;
alter table public.historia_clinica enable row level security;
alter table public.tramites         enable row level security;
alter table public.formulas         enable row level security;

-- especialidades: todos las ven; solo el admin las cambia.
create policy esp_leer     on public.especialidades for select using (true);
create policy esp_admin    on public.especialidades for all
  using (public.mi_rol() = 'admin') with check (public.mi_rol() = 'admin');

-- usuarios
create policy usu_leer on public.usuarios for select using (
  id = public.mi_usuario_id()       -- su propio perfil
  or rol = 'medico'                 -- todos ven a los médicos (para agendar)
  or public.es_personal()           -- el personal de salud ve a todos
);
create policy usu_registrarse on public.usuarios for insert with check (
  auth_id = auth.uid() and rol = 'paciente'   -- R.1-1: el paciente se registra solo
);
create policy usu_editar_propio on public.usuarios for update
  using (id = public.mi_usuario_id()) with check (id = public.mi_usuario_id());
create policy usu_admin on public.usuarios for all
  using (public.mi_rol() = 'admin') with check (public.mi_rol() = 'admin');

-- citas
create policy cit_leer on public.citas for select using (
  paciente_id = public.mi_usuario_id()
  or medico_id = public.mi_usuario_id()
  or public.mi_rol() in ('auxiliar', 'admin')
);
create policy cit_crear on public.citas for insert with check (
  paciente_id = public.mi_usuario_id() or public.mi_rol() in ('auxiliar', 'admin')
);
create policy cit_editar on public.citas for update using (
  paciente_id = public.mi_usuario_id()
  or medico_id = public.mi_usuario_id()
  or public.mi_rol() in ('auxiliar', 'admin')
) with check (
  paciente_id = public.mi_usuario_id()
  or medico_id = public.mi_usuario_id()
  or public.mi_rol() in ('auxiliar', 'admin')
);
create policy cit_borrar on public.citas for delete using (public.mi_rol() = 'admin');

-- historia clínica, trámites y fórmulas: el paciente ve lo suyo;
-- el personal de salud ve y registra; solo el admin borra.
create policy his_leer   on public.historia_clinica for select using (paciente_id = public.mi_usuario_id() or public.es_personal());
create policy his_crear  on public.historia_clinica for insert with check (public.es_personal());
create policy his_editar on public.historia_clinica for update using (public.mi_rol() = 'admin');
create policy his_borrar on public.historia_clinica for delete using (public.mi_rol() = 'admin');

create policy tra_leer   on public.tramites for select using (paciente_id = public.mi_usuario_id() or public.es_personal());
create policy tra_crear  on public.tramites for insert with check (public.es_personal());
create policy tra_editar on public.tramites for update using (public.es_personal());

create policy for_leer   on public.formulas for select using (paciente_id = public.mi_usuario_id() or public.es_personal());
create policy for_crear  on public.formulas for insert with check (public.mi_rol() in ('medico', 'admin'));

-- -----------------------------------------------------------
-- 4. Storage: bucket privado para exámenes y documentos
--    Ruta de cada archivo:  <id del paciente>/<fecha>-<nombre>
-- -----------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do update set public = false;

drop policy if exists doc_subir on storage.objects;
drop policy if exists doc_leer  on storage.objects;

create policy doc_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and public.es_personal());

create policy doc_leer on storage.objects for select to authenticated
  using (bucket_id = 'documentos'
         and (public.es_personal() or (storage.foldername(name))[1] = public.mi_usuario_id()));
