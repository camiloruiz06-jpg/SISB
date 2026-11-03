/* ===========================================================
   Repositorio: todas las lecturas y escrituras a Supabase.
   Solo se usa en MODO SUPABASE (ver supabase.js). En modo local
   la app trabaja con los datos en memoria y este archivo no se toca.

   Las pantallas no llaman este archivo directamente: lo usa
   AppContext, que primero actualiza la pantalla y luego guarda
   aquí (si falla, avisa y recarga los datos de la base).
   =========================================================== */
import { supabase } from './supabase'
import { TABLAS, aFila, deFila, correoDe } from './mapeo'
import { HOY, iso, sumaDias } from '../datos/utiles'

/** Lanza un error con un mensaje entendible para el usuario. */
const revisar = ({ data, error }) => {
  if (!error) return data
  const msg = error.code === '23505'
    ? (/turno/.test(error.message) ? 'Esa hora se acaba de ocupar. Elige otra.' : 'Ese documento o dato ya existe en el sistema.')
    : /row-level security|permission/i.test(error.message)
      ? 'No tienes permiso para hacer esto.'
      : error.message
  throw Object.assign(new Error(msg), { codigo: error.code })
}

/* ---------- sesión (Supabase Auth) ---------- */

async function perfilDe(authId) {
  const sb = await supabase()
  const fila = revisar(await sb.from('usuarios').select('*').eq('auth_id', authId).maybeSingle())
  return fila ? deFila('usuarios', fila) : null
}

/** Inicia sesión con documento y contraseña. Devuelve el usuario de la tabla "usuarios". */
export async function iniciarSesion(doc, clave) {
  const sb = await supabase()
  const { data, error } = await sb.auth.signInWithPassword({ email: correoDe(doc), password: clave })
  if (error) throw new Error(/invalid/i.test(error.message)
    ? 'El documento o la contraseña no coinciden. Revisa e intenta de nuevo.'
    : error.message)
  const usuario = await perfilDe(data.user.id)
  if (!usuario) { await sb.auth.signOut(); throw new Error('Tu cuenta existe pero no tiene perfil en SISB. Habla con el administrador.') }
  return usuario
}

/** Si el navegador ya tenía una sesión abierta, devuelve ese usuario (o null). */
export async function sesionGuardada() {
  const sb = await supabase()
  const { data } = await sb.auth.getSession()
  return data.session ? perfilDe(data.session.user.id) : null
}

export async function cerrarSesion() {
  const sb = await supabase()
  await sb.auth.signOut()
}

/** R.1-1: el paciente crea su propia cuenta desde el login. */
export async function registrarse(datos, clave) {
  const sb = await supabase()
  const { data, error } = await sb.auth.signUp({ email: correoDe(datos.doc), password: clave })
  if (error) throw new Error(/registered|exists/i.test(error.message) ? 'Ese documento ya tiene una cuenta.' : error.message)
  if (!data.session) throw new Error('Desactiva "Confirm email" en Supabase (Authentication → Providers → Email). Mira SUPABASE.md.')
  const fila = revisar(await sb.from('usuarios')
    .insert({ ...aFila('usuarios', { ...datos, rol: 'paciente' }), auth_id: data.user.id }).select().single())
  return deFila('usuarios', fila)
}

/**
 * El personal crea cuentas de otros (admin: cualquier rol; auxiliar: pacientes).
 * Usa la función del servidor "crear-usuario", porque crear cuentas ajenas
 * necesita la llave secreta, que nunca debe estar en el navegador.
 */
export async function crearUsuarioConCuenta(datos, clave) {
  const sb = await supabase()
  const { data, error } = await sb.functions.invoke('crear-usuario', { body: { usuario: aFila('usuarios', datos), clave } })
  if (error) {
    let msg = error.message
    try { msg = (await error.context.json()).error || msg } catch { /* respuesta sin JSON */ }
    throw new Error(msg)
  }
  return deFila('usuarios', data.usuario)
}

/* ---------- lectura ---------- */

/** Trae todas las filas de una tabla (Supabase entrega máximo 1.000 por consulta). */
async function traerTodo(tabla) {
  const sb = await supabase()
  const filas = []
  for (let desde = 0; ; desde += 1000) {
    const lote = revisar(await sb.from(TABLAS[tabla]).select('*').range(desde, desde + 999))
    filas.push(...lote)
    if (lote.length < 1000) break
  }
  return filas.map((f) => deFila(tabla, f))
}

/**
 * Carga todo lo que el usuario tiene permiso de ver (las reglas RLS de
 * schema.sql filtran solas: el paciente solo recibe lo suyo).
 */
export async function cargarTodo(usuario) {
  const sb = await supabase()
  const [especialidades, usuarios, citas, historia, tramites, formulas] = await Promise.all(
    ['especialidades', 'usuarios', 'citas', 'historia', 'tramites', 'formulas'].map(traerTodo))

  // El paciente no puede ver citas ajenas, pero al agendar necesita saber qué
  // turnos están ocupados. Se agregan como citas "ocultas" sin datos personales.
  if (usuario.rol === 'paciente') {
    const ocupados = revisar(await sb.rpc('turnos_ocupados', { desde: iso(HOY), hasta: iso(sumaDias(HOY, 31)) }))
    const propias = new Set(citas.map((c) => c.medicoId + c.fecha + c.hora))
    ocupados.filter((o) => !propias.has(o.medico_id + o.fecha + o.hora)).forEach((o, i) => citas.push({
      id: 'ocupado-' + i, medicoId: o.medico_id, fecha: o.fecha, hora: o.hora, estado: 'programada', oculta: true
    }))
  }
  return { especialidades, usuarios, citas, historia, tramites, formulas }
}

/* ---------- escritura ---------- */

export async function insertar(tabla, obj) {
  const sb = await supabase()
  revisar(await sb.from(TABLAS[tabla]).insert(aFila(tabla, obj)))
}

export async function actualizar(tabla, id, cambios) {
  const sb = await supabase()
  revisar(await sb.from(TABLAS[tabla]).update(aFila(tabla, cambios)).eq('id', id))
}

export async function eliminar(tabla, id) {
  const sb = await supabase()
  revisar(await sb.from(TABLAS[tabla]).delete().eq('id', id))
}

/* ---------- archivos (Supabase Storage) ---------- */

/** Sube un examen o documento al bucket privado. Devuelve la ruta guardada. */
export async function subirArchivo(pacienteId, archivo) {
  const sb = await supabase()
  const limpio = archivo.name.normalize('NFD').replace(/[^a-zA-Z0-9._-]/g, '_')
  const ruta = `${pacienteId}/${iso(new Date())}-${Date.now()}-${limpio}`
  revisar(await sb.storage.from('documentos').upload(ruta, archivo, { contentType: archivo.type }))
  return ruta
}

/** Enlace temporal (10 minutos) para ver o descargar un archivo privado (R.7-3). */
export async function enlaceArchivo(ruta) {
  const sb = await supabase()
  const data = revisar(await sb.storage.from('documentos').createSignedUrl(ruta, 600))
  return data?.signedUrl || null
}
