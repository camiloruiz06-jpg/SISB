/* ===========================================================
   Utilidades de fecha y texto que usa toda la aplicación.
   =========================================================== */

export const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
export const DOW = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']

/** Fecha de hoy a la medianoche (los datos de prueba se calculan a partir de ella). */
export const HOY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })()

/** Date -> '2026-10-08' */
export const iso = (d) =>
  d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')

/** '2026-10-08' -> Date */
export const desdeIso = (s) => {
  const [a, m, d] = s.split('-').map(Number)
  return new Date(a, m - 1, d)
}

export const sumaDias = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/** '2026-10-09' -> 'viernes 9 de octubre' */
export const fechaLarga = (s) => {
  const d = desdeIso(s)
  return DOW[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()]
}

/** '2026-10-09' -> '9 oct.' */
export const fechaCorta = (s) => {
  const d = desdeIso(s)
  return d.getDate() + ' ' + MESES[d.getMonth()].slice(0, 3) + '.'
}

/** Texto amable: 'Hoy', 'Mañana', 'En 3 días'... */
export const relativo = (s) => {
  const dif = Math.round((desdeIso(s) - HOY) / 86400000)
  if (dif === 0) return 'Hoy'
  if (dif === 1) return 'Mañana'
  if (dif === -1) return 'Ayer'
  return dif > 1 ? 'En ' + dif + ' días' : 'Hace ' + Math.abs(dif) + ' días'
}

/** 'Buenos días', 'Buenas tardes' o 'Buenas noches' según la hora. */
export const saludo = () => { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches' }

/** '14:30' -> '2:30 p. m.' (más fácil de leer para el paciente) */
export const hora12 = (h) => {
  const [H, M] = h.split(':').map(Number)
  const sufijo = H < 12 ? 'a. m.' : 'p. m.'
  const h12 = H % 12 === 0 ? 12 : H % 12
  return h12 + ':' + String(M).padStart(2, '0') + ' ' + sufijo
}

/** 'María Paulina Gutiérrez' -> 'MP' */
export const iniciales = (n) =>
  n.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()

/** '07:30' -> 450 minutos desde la medianoche */
export const aMinutos = (h) => { const [H, M] = h.split(':').map(Number); return H * 60 + M }

/** 450 -> '07:30' */
export const deMinutos = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0')

/** Minutos transcurridos del día actual (para no ofrecer horas que ya pasaron). */
export const minutosAhora = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes() }

/** Lista de los próximos N días en formato ISO */
export const proximosDias = (n = 14) =>
  Array.from({ length: n }, (_, i) => iso(sumaDias(HOY, i)))

/** Identificador único (también entre computadores distintos, para que sirva igual con Supabase). */
export const nuevoId = (prefijo) =>
  prefijo + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
