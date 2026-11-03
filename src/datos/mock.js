/* ===========================================================
   Datos de prueba (mientras no exista la base de datos).
   Cuando conectemos Supabase, estas listas se reemplazan por
   consultas a las tablas con el mismo nombre.
   =========================================================== */
import { HOY, iso, sumaDias } from './utiles'
import { generarDatos } from './generador'

export const especialidades = [
  { id: 'e1', nombre: 'Medicina general', icono: 'pulso',   desc: 'Gripa, fiebre, dolores, control general' },
  { id: 'e2', nombre: 'Pediatría',        icono: 'usuario', desc: 'Salud de niñas y niños' },
  { id: 'e3', nombre: 'Ginecología',      icono: 'escudo',  desc: 'Control prenatal y salud de la mujer' },
  { id: 'e4', nombre: 'Nutrición',        icono: 'receta',  desc: 'Alimentación, peso y diabetes' },
  { id: 'e5', nombre: 'Psicología',       icono: 'mic',     desc: 'Ánimo, nervios, acompañamiento' },
  { id: 'e6', nombre: 'Medicina interna', icono: 'archivo', desc: 'Tensión alta, azúcar, enfermedades largas' }
]

export const usuarios = [
  { id: 'u1', rol: 'paciente', doc: '1045882331', clave: '1234', nombre: 'María Paulina Gutiérrez',
    nac: '1991-03-14', tel: '310 455 2201', municipio: 'Repelón, Atlántico',
    vereda: 'Vereda Las Tablas', eps: 'Mutual SER', puesto: 'Puesto de salud Repelón' },

  { id: 'u2', rol: 'paciente', doc: '8744120', clave: '1234', nombre: 'José Nel Ariza Mendoza',
    nac: '1958-11-02', tel: '312 880 4417', municipio: 'Sabanalarga, Atlántico',
    vereda: 'Corregimiento Isabel López', eps: 'Nueva EPS', puesto: 'Centro de salud Isabel López' },

  { id: 'u3', rol: 'medico', doc: '52998114', clave: '1234', nombre: 'Luz Mery Pacheco',
    titulo: 'Dra.', espId: 'e1', registro: 'RM 88-2214', tel: '300 220 1190',
    horario: { duracion: 20, dias: {
      1: { manana: ['07:00', '12:00'], tarde: ['14:00', '17:00'] },
      2: { manana: ['07:00', '12:00'], tarde: null },
      3: { manana: ['07:00', '12:00'], tarde: ['14:00', '17:00'] },
      4: { manana: ['07:00', '12:00'], tarde: null },
      5: { manana: ['07:00', '12:00'], tarde: ['14:00', '16:00'] },
      6: { manana: ['08:00', '11:00'], tarde: null } } } },

  { id: 'u4', rol: 'medico', doc: '79110233', clave: '1234', nombre: 'Andrés Valencia Ruiz',
    titulo: 'Dr.', espId: 'e2', registro: 'RM 90-7781', tel: '301 774 9002',
    horario: { duracion: 30, dias: {
      1: { manana: ['08:00', '12:00'], tarde: null },
      2: { manana: null, tarde: ['14:00', '18:00'] },
      3: { manana: ['08:00', '12:00'], tarde: null },
      5: { manana: ['08:00', '12:00'], tarde: ['14:00', '16:00'] } } } },

  { id: 'u5', rol: 'medico', doc: '22811904', clave: '1234', nombre: 'Sandra Ospino Caro',
    titulo: 'Dra.', espId: 'e3', registro: 'RM 85-3390', tel: '315 008 2234',
    horario: { duracion: 30, dias: {
      2: { manana: ['07:30', '11:30'], tarde: ['14:00', '16:30'] },
      4: { manana: ['07:30', '11:30'], tarde: ['14:00', '16:30'] } } } },

  { id: 'u6', rol: 'auxiliar', doc: '1082331445', clave: '1234', nombre: 'Nelson Barrios Molina',
    puesto: 'Puesto de salud Repelón', tel: '318 440 7712' },

  { id: 'u7', rol: 'admin', doc: '1140899210', clave: '1234', nombre: 'Camilo Ruiz Alquichire',
    cargo: 'Administrador del sistema' }
]

export const citas = [
  { id: 'c1', pacienteId: 'u1', medicoId: 'u3', espId: 'e1', fecha: iso(sumaDias(HOY, 1)), hora: '08:00',
    motivo: 'Dolor de cabeza fuerte hace cinco días y mareo al levantarme.', estado: 'programada', modo: 'videollamada' },

  { id: 'c2', pacienteId: 'u1', medicoId: 'u5', espId: 'e3', fecha: iso(sumaDias(HOY, -21)), hora: '09:00',
    motivo: 'Control prenatal, semana 24.', estado: 'atendida', modo: 'videollamada',
    diagnostico: 'Embarazo de curso normal. Tensión 110/70. Se ordenan exámenes de rutina del tercer trimestre.',
    notas: 'Paciente refiere buen movimiento fetal. Se insiste en consumo de hierro.' },

  { id: 'c3', pacienteId: 'u2', medicoId: 'u3', espId: 'e1', fecha: iso(HOY), hora: '09:20',
    motivo: 'Revisión de la presión arterial, se me hinchan los pies.', estado: 'programada', modo: 'videollamada' },

  { id: 'c4', pacienteId: 'u2', medicoId: 'u3', espId: 'e1', fecha: iso(sumaDias(HOY, -45)), hora: '07:40',
    motivo: 'Control de hipertensión.', estado: 'atendida', modo: 'videollamada',
    diagnostico: 'Hipertensión arterial controlada. Se mantiene el tratamiento actual.',
    notas: 'Se explica importancia de bajar la sal en las comidas.' }
]

export const historia = [
  { id: 'h1', pacienteId: 'u1', fecha: iso(sumaDias(HOY, -21)), tipo: 'consulta',
    titulo: 'Control prenatal — semana 24', autor: 'Dra. Sandra Ospino Caro',
    detalle: 'Embarazo de curso normal. Tensión 110/70, peso 64 kg. Se ordenan exámenes del tercer trimestre.' },

  { id: 'h2', pacienteId: 'u1', fecha: iso(sumaDias(HOY, -14)), tipo: 'resultado',
    titulo: 'Cuadro hemático completo', autor: 'Laboratorio Hospital de Repelón',
    detalle: 'Hemoglobina 10.9 g/dL. Leve anemia, se indica suplemento de hierro.', archivo: 'cuadro-hematico.pdf' },

  { id: 'h3', pacienteId: 'u1', fecha: iso(sumaDias(HOY, -200)), tipo: 'documento',
    titulo: 'Carné de vacunación', autor: 'Auxiliar Nelson Barrios',
    detalle: 'Esquema completo de toxoide tetánico.', archivo: 'carne-vacunacion.jpg' },

  { id: 'h4', pacienteId: 'u2', fecha: iso(sumaDias(HOY, -45)), tipo: 'consulta',
    titulo: 'Control de hipertensión', autor: 'Dra. Luz Mery Pacheco',
    detalle: 'Tensión 140/90. Se mantiene losartán 50 mg cada 12 horas.' },

  { id: 'h5', pacienteId: 'u2', fecha: iso(sumaDias(HOY, -40)), tipo: 'resultado',
    titulo: 'Creatinina y glicemia', autor: 'Laboratorio Sabanalarga',
    detalle: 'Creatinina 1.1 mg/dL. Glicemia 118 mg/dL.', archivo: 'quimica-sanguinea.pdf' }
]

export const tramites = [
  { id: 't1', pacienteId: 'u1', titulo: 'Ecografía obstétrica de tercer trimestre', estado: 'pendiente',
    detalle: 'Pedir cita en el hospital de Repelón. Llevar la orden impresa.', fecha: iso(sumaDias(HOY, -21)) },
  { id: 't2', pacienteId: 'u1', titulo: 'Reclamar suplemento de hierro', estado: 'pendiente',
    detalle: 'Farmacia del puesto de salud. Mostrar la fórmula médica.', fecha: iso(sumaDias(HOY, -14)) },
  { id: 't3', pacienteId: 'u1', titulo: 'Cuadro hemático', estado: 'listo',
    detalle: 'Resultado ya cargado en tu historia clínica.', fecha: iso(sumaDias(HOY, -14)) },
  { id: 't4', pacienteId: 'u2', titulo: 'Autorización de nefrología', estado: 'pendiente',
    detalle: 'Radicar en la EPS Nueva EPS, sede Sabanalarga.', fecha: iso(sumaDias(HOY, -30)) }
]

export const formulas = [
  { id: 'f1', pacienteId: 'u1', fecha: iso(sumaDias(HOY, -14)), autor: 'Dra. Sandra Ospino Caro',
    items: ['Sulfato ferroso 300 mg — 1 tableta al día por 30 días', 'Ácido fólico 1 mg — 1 tableta al día'] },
  { id: 'f2', pacienteId: 'u2', fecha: iso(sumaDias(HOY, -45)), autor: 'Dra. Luz Mery Pacheco',
    items: ['Losartán 50 mg — 1 tableta cada 12 horas', 'Hidroclorotiazida 25 mg — 1 tableta en la mañana'] }
]

/** Copia inicial de toda la "base de datos" en memoria: los usuarios de prueba
    de arriba más cientos de pacientes y miles de citas generados (ver generador.js). */
export const datosIniciales = () => generarDatos(structuredClone({
  especialidades, usuarios, citas, historia, tramites, formulas
}))
