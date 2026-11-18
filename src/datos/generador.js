/* ===========================================================
   Generador de datos de prueba a escala real.
   Crea cientos de pacientes de municipios rurales del Caribe
   colombiano, médicos en todas las especialidades, auxiliares por
   puesto de salud y miles de citas (pasadas y futuras) que respetan
   los horarios de cada médico.

   Usa una "semilla" fija: siempre genera las mismas personas, así
   todos en el equipo ven los mismos datos al probar.
   Cuando exista Supabase, este archivo deja de usarse.
   =========================================================== */
import { HOY, iso, sumaDias, aMinutos, deMinutos, minutosAhora } from './utiles.js'

/* Números pseudoaleatorios reproducibles (algoritmo mulberry32). */
const crearAzar = (semilla) => () => {
  semilla |= 0; semilla = (semilla + 0x6D2B79F5) | 0
  let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const NOMBRES_M = ['José', 'Luis', 'Carlos', 'Jorge', 'Rafael', 'Manuel', 'Pedro', 'Andrés', 'Juan', 'Alberto', 'Eduardo', 'Ramiro', 'Álvaro', 'Hernando', 'Wilmer', 'Yeison', 'Brayan', 'Deivis', 'Edinson', 'Fredy', 'Javier', 'Néstor', 'Orlando', 'Rubén', 'Samuel', 'Tomás', 'Víctor', 'Emiro', 'Arnulfo', 'Dairo']
const NOMBRES_F = ['María', 'Ana', 'Luz', 'Carmen', 'Rosa', 'Yolanda', 'Marta', 'Gloria', 'Diana', 'Paola', 'Yuranis', 'Yesenia', 'Katerine', 'Luisa', 'Sandra', 'Liliana', 'Nelly', 'Dalgis', 'Eneida', 'Ledis', 'Milena', 'Johana', 'Ingrid', 'Daniela', 'Valentina', 'Mariana', 'Edilma', 'Osiris', 'Zunilda', 'Petrona']
const SEGUNDOS_M = ['', '', '', 'José', 'Andrés', 'Antonio', 'Enrique', 'Alfonso', 'David', 'Rafael']
const SEGUNDOS_F = ['', '', '', 'del Carmen', 'Isabel', 'Elena', 'Patricia', 'Fernanda', 'Cecilia', 'Rosa']
const APELLIDOS = ['Martínez', 'Rodríguez', 'Pérez', 'Gómez', 'Hernández', 'Díaz', 'Jiménez', 'Torres', 'Barrios', 'Mendoza', 'Ariza', 'Polo', 'Charris', 'De la Hoz', 'Orozco', 'Pacheco', 'Ospino', 'Cantillo', 'Rada', 'Fontalvo', 'Navarro', 'Escorcia', 'Montero', 'Villa', 'Caro', 'Guerrero', 'Padilla', 'Ruiz', 'Salcedo', 'Mejía', 'Rojano', 'Doria', 'Petro', 'Negrete', 'Arrieta', 'Simanca', 'Julio', 'Cabarcas', 'Olivo', 'Sarmiento', 'Hoyos', 'Sotelo', 'Banda', 'Vergara', 'Genes', 'Bula', 'Lozano', 'Montes']

/* SISB arranca solo en Pueblo Nuevo (Córdoba): la cabecera y su zona rural.
   Cada corregimiento tiene su puesto de salud y, alrededor, veredas y caseríos.
   Los nombres de veredas y caseríos son de ejemplo: se cambian aquí por los reales. */
const MUNICIPIO = 'Pueblo Nuevo, Córdoba'
const ZONAS = [
  ['Cintura', ['El Totumo', 'Los Mangos', 'La Ceiba']],
  ['Pueblo Nuevo', ['El Retiro', 'San Isidro', 'La Unión']],            // veredas cercanas a la cabecera
  ['Puerto Santo', ['Caño Prieto', 'Boca de López', 'El Pozón']],
  ['Neiva', ['Guayabal', 'Las Flores', 'Pozo Hondo']],
  ['Betulia', ['El Tesoro', 'Bijagual', 'Mata de Caña']],
  ['El Varal', ['El Brillante', 'Santa Fe', 'Las Palmas']],
  ['Palmira', ['La Esperanza', 'El Carmen', 'Nueva Vida']],
  ['Corcovao', ['Altos del Rosario', 'El Diamante', 'Caño Viejo']],
  ['La Granjita', ['Los Almendros', 'El Recreo', 'Villa Luz']],
  ['Los Limones', ['El Porvenir', 'Santa Rosa', 'San José']],
  ['Arenas del Norte', ['La Floresta', 'El Silencio', 'Bella Vista']],
  ['El Campano', ['Las Mercedes', 'El Paraíso', 'Media Luna']]
]
const puestoDe = (zona) => 'Puesto de salud ' + zona
const EPS = ['Nueva EPS', 'Coosalud', 'Mutual SER', 'Salud Total', 'Cajacopi', 'Sanitas']

const MOTIVOS = {
  e1: ['Fiebre y malestar general desde hace tres días.', 'Tos con flema que no se quita.', 'Dolor de cabeza frecuente.', 'Control de presión arterial.', 'Diarrea y dolor de barriga.', 'Dolor en la espalda baja al trabajar en el campo.', 'Renovar la fórmula de la tensión.', 'Mareos al levantarme.'],
  e2: ['Control de crecimiento y desarrollo.', 'El niño tiene fiebre y no quiere comer.', 'Tos y mocos desde hace una semana.', 'Brote en la piel.', 'Revisión de vacunas.', 'Diarrea en la niña de 2 años.'],
  e3: ['Control prenatal.', 'Dolor bajito en el vientre.', 'Planificación familiar.', 'Resultado de citología.', 'Retraso en la menstruación.'],
  e4: ['Control de peso.', 'Dieta para la diabetes.', 'El niño está bajo de peso.', 'Orientación para bajar el azúcar.'],
  e5: ['Me siento triste y sin ganas.', 'No puedo dormir bien.', 'Mucha ansiedad y nervios.', 'Acompañamiento por un duelo.'],
  e6: ['Control de diabetes.', 'Control de hipertensión.', 'Revisión de exámenes de riñón.', 'Dolor en el pecho al caminar.', 'Hinchazón en los pies.']
}
const DIAGNOSTICOS = {
  e1: ['Infección respiratoria aguda. Se indica acetaminofén, líquidos y reposo.', 'Hipertensión controlada. Se mantiene el tratamiento.', 'Gastroenteritis. Suero oral y dieta blanda.', 'Lumbalgia mecánica. Analgésico y pausas activas.'],
  e2: ['Crecimiento adecuado para la edad. Próximo control en 3 meses.', 'Rinofaringitis viral. Lavados nasales y control de fiebre.', 'Dermatitis leve. Crema hidratante.'],
  e3: ['Embarazo de curso normal. Se ordenan exámenes de rutina.', 'Se inicia método de planificación.', 'Citología normal. Control en un año.'],
  e4: ['Plan de alimentación entregado. Control en un mes.', 'Se ajusta la dieta para controlar el azúcar.'],
  e5: ['Se inicia acompañamiento psicológico semanal.', 'Técnicas de relajación y control en 15 días.'],
  e6: ['Diabetes tipo 2 en control. Se mantiene metformina.', 'Hipertensión en control. Se ajusta la dosis.', 'Se ordenan exámenes de función renal.']
}

/* Profesionales adicionales por especialidad (los de prueba u3, u4 y u5 ya existen). */
const MEDICOS = [
  ['e1', 'Dr.', 'Ramiro Fontalvo Charris', 20], ['e1', 'Dra.', 'Yuranis Polo Rada', 20], ['e1', 'Dr.', 'Hernando Escorcia Villa', 20],
  ['e2', 'Dra.', 'Paola Navarro Salcedo', 30], ['e2', 'Dr.', 'Eduardo Cantillo Mejía', 30],
  ['e3', 'Dra.', 'Liliana Orozco De la Hoz', 30], ['e3', 'Dra.', 'Milena Guerrero Padilla', 30],
  ['e4', 'Dra.', 'Daniela Montero Caro', 30], ['e4', 'Dr.', 'Javier Sarmiento Olivo', 30],
  ['e5', 'Dra.', 'Ingrid Cabarcas Julio', 40], ['e5', 'Dr.', 'Samuel Rojano Simanca', 40],
  ['e6', 'Dr.', 'Álvaro Mendoza Torres', 30], ['e6', 'Dra.', 'Gloria Hernández Barrios', 30]
]

/* Plantillas de jornada que se reparten entre los médicos generados. */
const JORNADAS = [
  { 1: ['07:00', '12:00', '14:00', '17:00'], 2: ['07:00', '12:00'], 3: ['07:00', '12:00', '14:00', '17:00'], 4: ['07:00', '12:00'], 5: ['07:00', '12:00', '14:00', '16:00'] },
  { 1: ['13:00', '18:00'], 2: ['07:00', '12:00', '13:00', '17:00'], 3: ['13:00', '18:00'], 4: ['07:00', '12:00', '13:00', '17:00'], 6: ['08:00', '12:00'] },
  { 2: ['08:00', '12:00', '14:00', '18:00'], 3: ['08:00', '12:00'], 5: ['08:00', '12:00', '14:00', '18:00'], 6: ['07:00', '11:00'] }
]
const aHorario = (plantilla, duracion) => ({
  duracion,
  dias: Object.fromEntries(Object.entries(plantilla).map(([d, h]) => {
    const manana = h[0] < '12:30' ? [h[0], h[1]] : null
    const tarde = manana ? (h[2] ? [h[2], h[3]] : null) : [h[0], h[1]]
    return [d, { manana, tarde }]
  }))
})

export function generarDatos(base) {
  const azar = crearAzar(20261102)
  const uno = (lista) => lista[Math.floor(azar() * lista.length)]
  const entre = (a, b) => a + Math.floor(azar() * (b - a + 1))

  const usuarios = [...base.usuarios]
  const docsUsados = new Set(usuarios.map((u) => u.doc))
  const nuevoDoc = (edad) => {
    let doc
    do {
      doc = edad > 45
        ? String(entre(1000000, 99999999))                     // cédulas antiguas: 7 u 8 dígitos
        : String(entre(1001, 1149)) + String(entre(100000, 999999)) // cédulas nuevas: 10 dígitos
    } while (docsUsados.has(doc))
    docsUsados.add(doc)
    return doc
  }
  const celular = () => '3' + entre(0, 2) + entre(0, 9) + ' ' + entre(100, 999) + ' ' + entre(1000, 9999)

  /* --- médicos --- */
  MEDICOS.forEach(([espId, titulo, nombre, duracion], i) => {
    usuarios.push({
      id: 'gm' + (i + 1), rol: 'medico', doc: nuevoDoc(40), clave: '1234', nombre, titulo, espId,
      registro: 'RM ' + entre(80, 99) + '-' + entre(1000, 9999), tel: celular(),
      horario: aHorario(JORNADAS[i % JORNADAS.length], duracion)
    })
  })

  /* --- auxiliares: uno por puesto de salud (Cintura ya tiene a Nelson) --- */
  ZONAS.slice(1).forEach(([zona], i) => {
    const mujer = azar() < 0.6
    usuarios.push({
      id: 'ga' + (i + 1), rol: 'auxiliar', doc: nuevoDoc(35), clave: '1234',
      nombre: uno(mujer ? NOMBRES_F : NOMBRES_M) + ' ' + uno(APELLIDOS) + ' ' + uno(APELLIDOS),
      puesto: puestoDe(zona), municipio: MUNICIPIO, tel: celular()
    })
  })

  /* --- pacientes --- */
  const pacientes = []
  for (let i = 1; i <= 1200; i++) {
    const mujer = azar() < 0.55
    const edad = azar() < 0.25 ? entre(0, 14) : entre(15, 88)
    const nac = sumaDias(HOY, -(edad * 365 + entre(0, 364)))
    const [zona, veredas] = ZONAS[Math.floor(Math.pow(azar(), 1.4) * ZONAS.length)] // unas zonas con más gente que otras
    // Unos viven en el centro del corregimiento y la mayoría en sus veredas y caseríos.
    const r = azar()
    const lugar = r < 0.3 ? (zona === 'Pueblo Nuevo' ? 'Cabecera municipal' : 'Corregimiento ' + zona)
      : (r < 0.75 ? 'Vereda ' : 'Caserío ') + uno(veredas) + ' · ' + zona
    const segundo = uno(mujer ? SEGUNDOS_F : SEGUNDOS_M)
    const p = {
      id: 'gp' + i, rol: 'paciente', doc: nuevoDoc(edad), clave: '1234',
      nombre: [uno(mujer ? NOMBRES_F : NOMBRES_M), segundo, uno(APELLIDOS), uno(APELLIDOS)].filter(Boolean).join(' '),
      nac: iso(nac), tel: celular(), municipio: MUNICIPIO, vereda: lugar,
      eps: uno(EPS), puesto: puestoDe(zona)
    }
    pacientes.push(p)
    usuarios.push(p)
  }

  /* --- citas: se llenan los turnos de cada médico, más llenos en los días cercanos --- */
  const citas = [...base.citas]
  const historia = [...base.historia]
  const ocupado = new Set(base.citas.map((c) => c.medicoId + '|' + c.fecha + '|' + c.hora))
  const medicos = usuarios.filter((u) => u.rol === 'medico')
  let n = 0

  for (let dia = -45; dia <= 21; dia++) {
    const fecha = sumaDias(HOY, dia)
    const f = iso(fecha)
    const dow = fecha.getDay()
    // Ocupación: alta en el pasado y en los próximos días, baja a tres semanas.
    const ocupacion = dia < 0 ? 0.62 : dia === 0 ? 0.8 : Math.max(0.12, 0.75 - dia * 0.03)
    for (const m of medicos) {
      const j = m.horario.dias[dow]
      if (!j) continue
      const dur = m.horario.duracion
      ;[j.manana, j.tarde].filter(Boolean).forEach(([ini, fin]) => {
        for (let t = aMinutos(ini); t + dur <= aMinutos(fin); t += dur) {
          const hora = deMinutos(t)
          const clave = m.id + '|' + f + '|' + hora
          if (ocupado.has(clave) || azar() > ocupacion) continue
          ocupado.add(clave)
          const p = pacientes[Math.floor(azar() * pacientes.length)]
          const r = azar()
          // Lo que ya pasó (días anteriores y las horas de hoy que ya terminaron) quedó atendido o no.
          const yaPaso = dia < 0 || (dia === 0 && t + dur <= minutosAhora())
          const estado = yaPaso ? (r < 0.8 ? 'atendida' : r < 0.9 ? 'no-asistio' : 'cancelada')
                       : (r < 0.05 ? 'cancelada' : 'programada')
          const cita = { id: 'gc' + ++n, pacienteId: p.id, medicoId: m.id, espId: m.espId, fecha: f, hora,
            motivo: uno(MOTIVOS[m.espId] || MOTIVOS.e1), estado, modo: 'videollamada' }
          if (estado === 'atendida') {
            cita.diagnostico = uno(DIAGNOSTICOS[m.espId] || DIAGNOSTICOS.e1)
            historia.push({ id: 'gh' + n, pacienteId: p.id, fecha: f, tipo: 'consulta',
              titulo: 'Consulta de ' + (m.espId === 'e1' ? 'medicina general' : 'especialista'),
              autor: m.titulo + ' ' + m.nombre, detalle: cita.diagnostico })
          }
          citas.push(cita)
        }
      })
    }
  }

  return { ...base, usuarios, citas, historia }
}
