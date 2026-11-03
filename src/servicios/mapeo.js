/* ===========================================================
   Traducción entre los objetos de la app y las filas de Supabase.
   La app usa camelCase (pacienteId); la base usa snake_case
   (paciente_id). Este archivo no depende de Vite ni de React:
   también lo usa el script scripts/cargar-datos.mjs.
   =========================================================== */

/** Dominio interno de los correos: cada usuario entra con <documento>@sisb.local */
export const DOMINIO_CORREO = 'sisb.local'
export const correoDe = (doc) => String(doc).trim() + '@' + DOMINIO_CORREO

/** Contraseña de los usuarios de prueba en Supabase (Auth exige mínimo 6 caracteres). */
export const CLAVE_DEMO_SUPABASE = 'sisb1234'

/* Columnas por tabla: [nombre en la app, nombre en la base] */
const COLUMNAS = {
  especialidades: [['id', 'id'], ['nombre', 'nombre'], ['desc', 'descripcion'], ['icono', 'icono']],
  usuarios: [['id', 'id'], ['rol', 'rol'], ['doc', 'doc'], ['nombre', 'nombre'], ['titulo', 'titulo'], ['nac', 'nac'],
    ['tel', 'tel'], ['municipio', 'municipio'], ['vereda', 'vereda'], ['eps', 'eps'], ['puesto', 'puesto'],
    ['cargo', 'cargo'], ['espId', 'esp_id'], ['registro', 'registro'], ['horario', 'horario']],
  citas: [['id', 'id'], ['pacienteId', 'paciente_id'], ['medicoId', 'medico_id'], ['espId', 'esp_id'], ['fecha', 'fecha'],
    ['hora', 'hora'], ['motivo', 'motivo'], ['estado', 'estado'], ['modo', 'modo'], ['diagnostico', 'diagnostico'], ['notas', 'notas']],
  historia: [['id', 'id'], ['pacienteId', 'paciente_id'], ['fecha', 'fecha'], ['tipo', 'tipo'], ['titulo', 'titulo'],
    ['autor', 'autor'], ['detalle', 'detalle'], ['archivo', 'archivo'], ['archivoRuta', 'archivo_ruta']],
  tramites: [['id', 'id'], ['pacienteId', 'paciente_id'], ['titulo', 'titulo'], ['detalle', 'detalle'], ['estado', 'estado'], ['fecha', 'fecha']],
  formulas: [['id', 'id'], ['pacienteId', 'paciente_id'], ['fecha', 'fecha'], ['autor', 'autor'], ['items', 'items']]
}

/** Nombre real de cada tabla en Supabase. */
export const TABLAS = {
  especialidades: 'especialidades', usuarios: 'usuarios', citas: 'citas',
  historia: 'historia_clinica', tramites: 'tramites', formulas: 'formulas'
}

/** Objeto de la app -> fila de la base. Solo copia los campos que vienen (sirve para updates parciales). */
export const aFila = (tabla, obj) => {
  const fila = {}
  for (const [app, base] of COLUMNAS[tabla]) {
    if (obj[app] === undefined) continue
    fila[base] = obj[app] === '' ? null : obj[app]
  }
  return fila
}

/** Fila de la base -> objeto de la app. Quita los null para que se vea igual que los datos locales. */
export const deFila = (tabla, fila) => {
  const obj = {}
  for (const [app, base] of COLUMNAS[tabla]) {
    if (fila[base] !== null && fila[base] !== undefined) obj[app] = fila[base]
  }
  return obj
}
