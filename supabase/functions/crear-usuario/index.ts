// ===========================================================
// Función del servidor (Supabase Edge Function): crear-usuario
//
// Crea la cuenta de acceso (Supabase Auth) y el perfil en la tabla
// "usuarios" de OTRA persona. Se necesita aquí, en el servidor,
// porque crear cuentas ajenas requiere la llave secreta service_role,
// que nunca debe llegar al navegador.
//
// Quién puede usarla:
//   - administrador → cualquier rol (R.9-1: registrar médicos y auxiliares)
//   - auxiliar      → solo pacientes (R.1-1 asistido en el puesto de salud)
//
// Publicarla:  supabase functions deploy crear-usuario
// (Supabase le entrega solas las variables SUPABASE_URL,
//  SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY.)
// ===========================================================
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}
const responder = (cuerpo: unknown, estado = 200) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: { ...CORS, 'Content-Type': 'application/json' } })

const ROLES = ['paciente', 'medico', 'auxiliar', 'admin']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return responder({ error: 'Método no permitido.' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

  // 1. ¿Quién llama? Se valida con su propia sesión.
  const token = (req.headers.get('Authorization') || '').replace('Bearer ', '')
  const { data: quien } = await admin.auth.getUser(token)
  if (!quien?.user) return responder({ error: 'Debes iniciar sesión.' }, 401)
  const { data: perfil } = await admin.from('usuarios').select('rol').eq('auth_id', quien.user.id).eq('activo', true).maybeSingle()
  if (!perfil) return responder({ error: 'Tu cuenta no tiene perfil en SISB.' }, 403)

  // 2. ¿Qué quiere crear?
  let cuerpo: { usuario?: Record<string, unknown>; clave?: string }
  try { cuerpo = await req.json() } catch { return responder({ error: 'Solicitud inválida.' }, 400) }
  const usuario = { ...(cuerpo.usuario || {}) }
  const clave = String(cuerpo.clave || '')
  const rol = String(usuario.rol || 'paciente')
  const doc = String(usuario.doc || '').trim()

  if (!ROLES.includes(rol)) return responder({ error: 'Rol no válido.' }, 400)
  if (!/^[0-9]{5,12}$/.test(doc)) return responder({ error: 'El documento debe tener solo números (5 a 12).' }, 400)
  if (!usuario.nombre) return responder({ error: 'Falta el nombre.' }, 400)
  if (clave.length < 6) return responder({ error: 'La contraseña debe tener al menos 6 caracteres.' }, 400)
  const permitido = perfil.rol === 'admin' || (perfil.rol === 'auxiliar' && rol === 'paciente')
  if (!permitido) return responder({ error: 'No tienes permiso para crear este tipo de usuario.' }, 403)

  // 3. Se crea la cuenta de acceso...
  const { data: cuenta, error: errCuenta } = await admin.auth.admin.createUser({
    email: `${doc}@sisb.local`, password: clave, email_confirm: true, user_metadata: { nombre: usuario.nombre }
  })
  if (errCuenta) {
    const ya = /already|registered|exists/i.test(errCuenta.message)
    return responder({ error: ya ? 'Ese documento ya tiene una cuenta.' : errCuenta.message }, ya ? 409 : 400)
  }

  // 4. ...y el perfil. Si el perfil falla, se borra la cuenta para no dejar basura.
  delete usuario.id
  delete usuario.auth_id
  const { data: fila, error: errFila } = await admin.from('usuarios')
    .insert({ ...usuario, rol, doc, auth_id: cuenta.user.id }).select().single()
  if (errFila) {
    await admin.auth.admin.deleteUser(cuenta.user.id)
    const dup = errFila.code === '23505'
    return responder({ error: dup ? 'Ese documento ya está registrado en el sistema.' : errFila.message }, dup ? 409 : 400)
  }
  return responder({ usuario: fila })
})
