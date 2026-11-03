/* ===========================================================
   Capa de servicios.
   Hoy trabaja sobre los datos en memoria. Cuando conectemos
   Supabase, SOLO hay que cambiar el cuerpo de estas funciones:
   las pantallas no se tocan.

   Ejemplo de cómo quedará con Supabase:
     export const listarCitasDePaciente = async (db, id) => {
       const { data } = await supabase.from('citas').select('*').eq('paciente_id', id)
       return data
     }
   =========================================================== */

import { HOY, iso, aMinutos, deMinutos, minutosAhora } from '../datos/utiles'

/* ---------- índices ----------
   Con miles de registros no se puede recorrer toda la lista en cada consulta.
   Estos índices se arman una sola vez por versión de los datos (cuando algo cambia,
   React crea una lista nueva y el índice se vuelve a armar). Con Supabase este
   trabajo lo hacen los índices de PostgreSQL. */
const cache = new WeakMap()
const indexar = (lista, armar) => {
  if (!cache.has(lista)) cache.set(lista, armar(lista))
  return cache.get(lista)
}
const agrupar = (lista, clave) => {
  const m = new Map()
  for (const x of lista) { const k = clave(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x) }
  return m
}
const indiceUsuarios = (db) => indexar(db.usuarios, (l) => ({
  porId: new Map(l.map((u) => [u.id, u])),
  pacientes: l.filter((u) => u.rol === 'paciente')
}))
const indiceCitas = (db) => indexar(db.citas, (l) => ({
  porMedicoDia: agrupar(l, (c) => c.medicoId + '|' + c.fecha),
  porPaciente: agrupar(l, (c) => c.pacienteId),
  porMedico: agrupar(l, (c) => c.medicoId)
}))

/* Quita tildes y mayúsculas para comparar textos. */
export const normalizar = (t) => (t || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/* ---------- consultas ---------- */
export const buscarUsuario = (db, id) => indiceUsuarios(db).porId.get(id)
export const listarPacientes = (db) => indiceUsuarios(db).pacientes
export const citasDePaciente = (db, pacienteId) => indiceCitas(db).porPaciente.get(pacienteId) || []
export const citasDeMedico = (db, medicoId) => indiceCitas(db).porMedico.get(medicoId) || []
export const citasDelDia = (db, medicoId, fecha) =>
  (indiceCitas(db).porMedicoDia.get(medicoId + '|' + fecha) || []).slice().sort((a, b) => a.hora.localeCompare(b.hora))

/**
 * Busca pacientes por cédula (si se escriben números) o por nombre.
 * Las cédulas que EMPIEZAN por lo escrito salen primero.
 */
export const buscarPacientes = (db, texto, lista = listarPacientes(db)) => {
  const q = normalizar(texto.trim())
  if (!q) return lista
  const soloNumeros = q.replace(/[\s.]/g, '')
  if (/^\d+$/.test(soloNumeros)) {
    const empieza = lista.filter((p) => p.doc.startsWith(soloNumeros))
    const contiene = lista.filter((p) => !p.doc.startsWith(soloNumeros) && p.doc.includes(soloNumeros))
    return [...empieza, ...contiene]
  }
  const palabras = q.split(/\s+/)
  return lista.filter((p) => {
    const t = normalizar(p.nombre + ' ' + (p.municipio || '') + ' ' + (p.vereda || ''))
    return palabras.every((w) => t.includes(w))
  })
}
export const buscarEspecialidad = (db, id) => db.especialidades.find((x) => x.id === id)

export const nombreMedico = (m) => (m ? (m.titulo ? m.titulo + ' ' : '') + m.nombre : 'Profesional')

export const medicosDeEspecialidad = (db, espId) =>
  db.usuarios.filter((x) => x.rol === 'medico' && x.espId === espId)

export const listarCitas = (db, filtro) =>
  db.citas.filter(filtro).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))

/* ---------- horarios ----------
   Cada médico tiene una jornada por día de la semana (1 = lunes ... 6 = sábado),
   con un bloque de mañana y otro de tarde, y una duración fija por consulta:
     horario: { duracion: 20, dias: { 1: { manana: ['07:00','12:00'], tarde: ['14:00','17:00'] } } }
   Los turnos se calculan a partir de eso; no se guardan uno por uno. */

/** Días de la semana en que atiende, ordenados. */
export const diasDeAtencion = (horario) =>
  Object.keys(horario?.dias || {}).map(Number)
    .filter((d) => horario.dias[d] && (horario.dias[d].manana || horario.dias[d].tarde))
    .sort((a, b) => a - b)

/** Turnos ('07:00', '07:20'...) de un día de la semana según la jornada. */
export const turnosDeJornada = (horario, diaSemana) => {
  const j = horario?.dias?.[diaSemana]
  if (!j) return []
  const dur = horario.duracion || 20
  const turnos = []
  ;[j.manana, j.tarde].filter(Boolean).forEach(([ini, fin]) => {
    for (let t = aMinutos(ini); t + dur <= aMinutos(fin); t += dur) turnos.push(deMinutos(t))
  })
  return turnos
}

/** Una hora está ocupada si se cruza con otra cita no cancelada de ese médico. */
export const horaOcupada = (db, medicoId, fecha, hora) => {
  const m = buscarUsuario(db, medicoId)
  const dur = m?.horario?.duracion || 20
  const ini = aMinutos(hora)
  return (indiceCitas(db).porMedicoDia.get(medicoId + '|' + fecha) || []).some((c) => c.estado !== 'cancelada' &&
    aMinutos(c.hora) < ini + dur && ini < aMinutos(c.hora) + dur)
}

/** Turnos del médico ese día, marcando cuáles están libres. Hoy no se ofrecen las horas que ya pasaron. */
export const horasDelDia = (db, medicoId, fecha) => {
  const m = buscarUsuario(db, medicoId)
  if (!m || !m.horario) return []
  const diaSemana = new Date(fecha + 'T00:00:00').getDay()
  const esHoy = fecha === iso(HOY)
  return turnosDeJornada(m.horario, diaSemana)
    .filter((h) => !esHoy || aMinutos(h) > minutosAhora() + 30)
    .map((h) => ({ hora: h, libre: !horaOcupada(db, medicoId, fecha, h) }))
}

export const historiaDePaciente = (db, pacienteId) =>
  db.historia.filter((h) => h.pacienteId === pacienteId).sort((a, b) => b.fecha.localeCompare(a.fecha))

export const tramitesDePaciente = (db, pacienteId) => db.tramites.filter((t) => t.pacienteId === pacienteId)

export const formulasDePaciente = (db, pacienteId) =>
  db.formulas.filter((f) => f.pacienteId === pacienteId).sort((a, b) => b.fecha.localeCompare(a.fecha))

/* ---------- autenticación ---------- */
export const autenticar = (db, documento, clave, rol) => {
  const usuario = db.usuarios.find((x) => x.doc === documento && x.rol === rol)
  if (!usuario) return { error: 'No encontramos ese documento para el perfil seleccionado. Revisa el número o cambia el perfil.' }
  if (usuario.clave !== clave) return { error: 'La contraseña no coincide. Intenta de nuevo.' }
  return { usuario }
}
