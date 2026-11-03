/* ===========================================================
   Cliente de Supabase.

   Interruptor de toda la app:
     - Sin llaves en el .env  → MODO LOCAL: datos de prueba en memoria.
     - Con llaves en el .env  → MODO SUPABASE: base de datos real.

   La librería se descarga solo si hay llaves (import dinámico), así
   el modo local no carga peso extra con internet lento.
   =========================================================== */
const URL = import.meta.env.VITE_SUPABASE_URL
const LLAVE = import.meta.env.VITE_SUPABASE_ANON_KEY

export const usaSupabase = Boolean(URL && LLAVE && !URL.includes('TU-PROYECTO'))

let cliente = null

/** Devuelve el cliente de Supabase (lo crea la primera vez). */
export async function supabase() {
  if (!usaSupabase) throw new Error('Supabase no está configurado (faltan las llaves en el .env).')
  if (!cliente) {
    const { createClient } = await import('@supabase/supabase-js')
    cliente = createClient(URL, LLAVE, { auth: { persistSession: true, autoRefreshToken: true } })
  }
  return cliente
}
