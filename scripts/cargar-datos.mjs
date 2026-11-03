/* ===========================================================
   Carga los datos de prueba de SISB en Supabase.

   Uso (desde la carpeta sisb-web, con el .env lleno):
     npm run supabase:cargar

   Qué hace:
     1. Genera los mismos datos que ve la app en modo local
        (usuarios de prueba + ~1.200 pacientes + miles de citas).
     2. Los sube a las tablas, en bloques de 500 filas.
     3. Crea las cuentas de Supabase Auth del personal de salud
        (médicos, auxiliares, admin) y de los 2 pacientes de prueba,
        todas con la contraseña "sisb1234".

   Necesita la llave SECRETA "service_role" (SUPABASE_SERVICE_ROLE_KEY).
   Esa llave salta todas las reglas de seguridad: va SOLO en el .env
   de tu computador, nunca en GitHub, nunca en Vercel, nunca con
   prefijo VITE_ (eso la publicaría en el navegador).
   =========================================================== */
import { createClient } from '@supabase/supabase-js'
import { datosIniciales } from '../src/datos/mock.js'
import { TABLAS, aFila, correoDe, CLAVE_DEMO_SUPABASE } from '../src/servicios/mapeo.js'

const url = process.env.VITE_SUPABASE_URL
const llave = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !llave || url.includes('TU-PROYECTO')) {
  console.error('\n✗ Faltan VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el archivo .env (mira SUPABASE.md).\n')
  process.exit(1)
}
const supabase = createClient(url, llave, { auth: { persistSession: false, autoRefreshToken: false } })

const BLOQUE = 500
async function subir(tabla, filas) {
  for (let i = 0; i < filas.length; i += BLOQUE) {
    const { error } = await supabase.from(TABLAS[tabla]).upsert(filas.slice(i, i + BLOQUE))
    if (error) throw new Error(`${TABLAS[tabla]}: ${error.message}`)
    process.stdout.write(`\r  ${TABLAS[tabla]}: ${Math.min(i + BLOQUE, filas.length)} / ${filas.length}`)
  }
  console.log()
}

/** Crea (o reutiliza) la cuenta de Auth de un usuario y la enlaza con su fila. */
async function crearCuenta(u) {
  const email = correoDe(u.doc)
  let { data, error } = await supabase.auth.admin.createUser({
    email, password: CLAVE_DEMO_SUPABASE, email_confirm: true, user_metadata: { nombre: u.nombre }
  })
  if (error && /already|registered|exists/i.test(error.message)) {
    // Ya existía: la buscamos para enlazarla.
    const { data: lista } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    data = { user: lista.users.find((x) => x.email === email) }
    error = null
  }
  if (error) throw new Error(`cuenta de ${u.nombre}: ${error.message}`)
  const { error: e2 } = await supabase.from('usuarios').update({ auth_id: data.user.id }).eq('id', u.id)
  if (e2) throw new Error(`enlazar ${u.nombre}: ${e2.message}`)
}

const db = datosIniciales()
console.log('\nSubiendo datos de prueba de SISB a ' + url + '\n')

await subir('especialidades', db.especialidades.map((x) => aFila('especialidades', x)))
await subir('usuarios', db.usuarios.map((x) => aFila('usuarios', x)))
await subir('citas', db.citas.map((x) => aFila('citas', x)))
await subir('historia', db.historia.map((x) => aFila('historia', x)))
await subir('tramites', db.tramites.map((x) => aFila('tramites', x)))
await subir('formulas', db.formulas.map((x) => aFila('formulas', x)))

const conCuenta = db.usuarios.filter((u) => u.rol !== 'paciente' || ['u1', 'u2'].includes(u.id))
console.log(`\nCreando ${conCuenta.length} cuentas de acceso (contraseña: ${CLAVE_DEMO_SUPABASE})...`)
for (const [i, u] of conCuenta.entries()) {
  await crearCuenta(u)
  process.stdout.write(`\r  cuentas: ${i + 1} / ${conCuenta.length}`)
}
console.log('\n\n✓ Listo. Ya puedes entrar a la app con cualquier usuario de prueba y la contraseña ' + CLAVE_DEMO_SUPABASE + '.\n')
