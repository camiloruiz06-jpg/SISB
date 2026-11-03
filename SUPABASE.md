# Conectar SISB a Supabase

La app ya está preparada: **no hay que cambiar ninguna pantalla**. Mientras el `.env`
no tenga llaves, SISB funciona en **modo local** (datos de prueba en memoria, como hasta
ahora). Apenas se ponen las llaves, pasa sola a **modo Supabase**.

| | Modo local (hoy) | Modo Supabase |
|---|---|---|
| Datos | En memoria, se reinician al recargar | Base PostgreSQL, quedan guardados |
| Contraseñas | En texto, solo de prueba | Cifradas por Supabase Auth (R.1-5) |
| Sesión | Se cierra al recargar | Se mantiene al recargar |
| Seguridad por rol | La hacen las pantallas | La hace la base con RLS (R.2-4) |
| Exámenes y documentos | Solo el nombre del archivo | Archivo real en un bucket privado (R.8-5) |
| Contraseña de los usuarios de prueba | `1234` | `sisb1234` (Supabase exige mínimo 6) |

---

## Paso 1. Crear el proyecto (5 min)

1. Entra a https://supabase.com, crea una cuenta y dale **New project**.
2. Nombre: `sisb`. Región: **East US** (la más cercana a Colombia). Guarda la contraseña de la base.
3. Espera a que termine de crearse (1–2 minutos).

## Paso 2. Crear las tablas (1 min)

1. En el menú izquierdo: **SQL Editor** → **New query**.
2. Copia y pega **todo** el archivo [`supabase/schema.sql`](supabase/schema.sql) y dale **Run**.
3. Debe decir *Success*. En **Table Editor** ya aparecen las 6 tablas.

## Paso 3. Ajustar el inicio de sesión (1 min)

Cada usuario entra con su **documento**. Por dentro, Supabase usa un correo interno
`<documento>@sisb.local`, que no existe de verdad, así que hay que apagar la confirmación por correo:

**Authentication → Sign In / Providers → Email** → desactiva **Confirm email** → **Save**.

## Paso 4. Poner las llaves (2 min)

1. En Supabase: **Project Settings → API**.
2. En la carpeta `sisb-web`, copia `.env.example` y renómbralo `.env`.
3. Pega ahí la **Project URL**, la llave **anon public** y la llave **service_role**.

> ⚠️ La llave `service_role` salta todas las reglas de seguridad. Va **solo** en el `.env`
> de tu computador: nunca en GitHub, nunca en Vercel, nunca con el prefijo `VITE_`.

## Paso 5. Cargar los datos de prueba (2 min)

```bash
npm run supabase:cargar
```

Sube los mismos datos que ves en modo local (unos 1.200 pacientes, 16 médicos, 25 auxiliares
y miles de citas) y crea las cuentas del personal y de los 2 pacientes de prueba con la
contraseña **`sisb1234`**. Los demás pacientes generados quedan sin cuenta, como pasa en la
realidad con quien nunca ha entrado: el auxiliar los atiende igual.

> Las fechas de las citas se calculan desde el día en que corres el comando. Si quieres
> "refrescarlas" más adelante, vuelve a correr `schema.sql` (borra todo) y luego este comando.

## Paso 6. Publicar la función para crear cuentas (5 min)

El administrador crea médicos y auxiliares, y el auxiliar registra pacientes con su cuenta,
mediante la función del servidor [`supabase/functions/crear-usuario`](supabase/functions/crear-usuario/index.ts).
Se publica una sola vez:

```bash
npx supabase login
npx supabase link --project-ref TU-PROJECT-REF
npx supabase functions deploy crear-usuario
```

El *project ref* es el código que aparece en la URL del proyecto: `https://<ref>.supabase.co`.

## Paso 7. Probar

```bash
npm run dev
```

Entra con cualquier usuario de prueba (contraseña `sisb1234`). Agenda una cita, recarga la
página: la cita sigue ahí y la sesión también. 🎉

## Paso 8. Vercel

En Vercel: **Project → Settings → Environment Variables** agrega **solo** estas dos
(la `service_role` NO):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Después: **Deployments → ⋯ → Redeploy**. Listo: https://sisb-pi.vercel.app ya usa la base real.

---

## Cómo está armado por dentro

```
supabase/
├─ schema.sql                    Tablas, índices, reglas RLS y bucket de Storage
└─ functions/crear-usuario/      Función del servidor para crear cuentas ajenas
scripts/
└─ cargar-datos.mjs              Sube los datos de prueba y crea las cuentas
src/servicios/
├─ supabase.js                   Interruptor local/Supabase y cliente
├─ repositorio.js                Lecturas y escrituras a Supabase
└─ mapeo.js                      camelCase de la app ↔ snake_case de la base
src/contexto/AppContext.jsx      Actualiza la pantalla y guarda en la base
```

**Flujo de cada acción** (agendar, cancelar, guardar diagnóstico…): la pantalla se actualiza
al instante y por detrás se guarda en Supabase. Si la base lo rechaza (por ejemplo, otra
persona tomó ese turno un segundo antes), sale un aviso y se recargan los datos reales.

**Reglas que cumple la propia base** (aunque alguien se salte la pantalla):

| Regla | Requisito | Dónde |
|---|---|---|
| No hay documentos duplicados | R.1-6 | `usuarios.doc unique` |
| No se cruzan dos citas del mismo médico | R.3-5 | índice `citas_turno_unico` |
| El paciente solo ve sus citas, historia, trámites y fórmulas | R.2-4 | políticas RLS |
| Un usuario no puede cambiarse su propio rol | R.2-4 | trigger `proteger_usuario` |
| Solo el personal sube archivos; el paciente solo ve los suyos | R.8-5 | políticas de Storage |
| Contraseñas cifradas | R.1-5 | Supabase Auth |

**Limitaciones conocidas del prototipo**

- Si el admin cambia el número de documento de un usuario que ya tiene cuenta, su correo
  interno sigue siendo el viejo: debe seguir entrando con el documento anterior.
- Eliminar un usuario borra su perfil y sus datos, pero su cuenta de Auth queda (sin acceso
  a nada). Se puede borrar a mano en **Authentication → Users**.
- La app carga en memoria todo lo que el usuario puede ver. Para unos miles de registros va
  bien; con decenas de miles convendría paginar en el servidor.
