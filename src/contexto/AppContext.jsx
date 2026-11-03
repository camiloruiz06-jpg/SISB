import React, { createContext, useContext, useMemo, useState } from 'react'
import { datosIniciales } from '../datos/mock'
import { nuevoId, iso, HOY } from '../datos/utiles'
import { autenticar, buscarUsuario, horaOcupada, buscarEspecialidad, nombreMedico } from '../servicios/api'

/* ===========================================================
   Estado global de la aplicación: sesión, datos, avisos y modales.
   Cualquier pantalla lo usa con:   const { db, sesion, acciones } = useApp()
   =========================================================== */

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

export function ProveedorApp({ children }) {
  const [db, setDb] = useState(datosIniciales)
  const [sesionId, setSesionId] = useState(null)
  const [avisos, setAvisos] = useState([])
  const [modal, setModal] = useState(null)
  const [escala, setEscala] = useState('normal')

  // La sesión siempre se lee de la base, así nunca queda desactualizada.
  const sesion = useMemo(() => (sesionId ? db.usuarios.find((u) => u.id === sesionId) : null), [db, sesionId])

  /* ---------- avisos ---------- */
  const aviso = (texto, tipo = 'ok') => {
    const id = Math.random().toString(36).slice(2)
    setAvisos((a) => [...a, { id, texto, tipo }])
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 3800)
  }

  /* ---------- sesión ---------- */
  const entrar = (documento, clave, rol) => {
    const { usuario, error } = autenticar(db, documento, clave, rol)
    if (error) { aviso(error, 'error'); return null }
    setSesionId(usuario.id)
    aviso('Bienvenido, ' + (usuario.rol === 'medico' ? nombreMedico(usuario) : usuario.nombre.split(' ')[0]) + '.')
    return usuario
  }
  const entrarDirecto = (usuario) => {
    setSesionId(usuario.id)
    aviso('Bienvenido, ' + (usuario.rol === 'medico' ? nombreMedico(usuario) : usuario.nombre.split(' ')[0]) + '.')
  }
  const salir = () => { setSesionId(null); aviso('Sesión cerrada.') }

  /* ---------- acciones sobre los datos ---------- */
  const acciones = {
    /* --- citas --- */
    agendarCita({ pacienteId, medicoId, espId, fecha, hora, motivo }) {
      if (horaOcupada(db, medicoId, fecha, hora)) { aviso('Esa hora se acaba de ocupar. Elige otra.', 'error'); return false }
      const cita = { id: nuevoId('c'), pacienteId, medicoId, espId, fecha, hora,
        motivo: motivo || 'Sin motivo escrito.', estado: 'programada', modo: 'videollamada' }
      setDb((d) => ({ ...d, citas: [...d.citas, cita] }))
      return true
    },
    reprogramarCita(citaId, fecha, hora, motivo) {
      const cita = db.citas.find((c) => c.id === citaId)
      if (horaOcupada(db, cita.medicoId, fecha, hora)) { aviso('Esa hora se acaba de ocupar. Elige otra.', 'error'); return false }
      setDb((d) => ({ ...d, citas: d.citas.map((c) => (c.id === citaId ? { ...c, fecha, hora, motivo: motivo || c.motivo } : c)) }))
      return true
    },
    cambiarEstadoCita(citaId, estado) {
      setDb((d) => ({ ...d, citas: d.citas.map((c) => (c.id === citaId ? { ...c, estado } : c)) }))
    },
    /* --- consulta médica: guarda en la cita y en la historia clínica --- */
    guardarConsulta(citaId, diagnostico, notas, medico) {
      const cita = db.citas.find((c) => c.id === citaId)
      const registro = {
        id: nuevoId('h'), pacienteId: cita.pacienteId, fecha: cita.fecha, tipo: 'consulta',
        titulo: buscarEspecialidad(db, cita.espId).nombre + ' — teleconsulta',
        autor: nombreMedico(medico), detalle: diagnostico + (notas ? ' ' + notas : '')
      }
      setDb((d) => ({
        ...d,
        citas: d.citas.map((c) => (c.id === citaId ? { ...c, diagnostico, notas, estado: 'atendida' } : c)),
        historia: [...d.historia, registro]
      }))
      aviso('Consulta guardada en la historia clínica del paciente.')
    },
    /* --- usuarios --- */
    registrarUsuario(datos) {
      if (db.usuarios.some((x) => x.doc === datos.doc)) { aviso('Ese documento ya está registrado en el sistema.', 'error'); return null }
      const nuevo = { id: nuevoId('u'), rol: 'paciente', puesto: '—', ...datos }
      setDb((d) => ({ ...d, usuarios: [...d.usuarios, nuevo] }))
      aviso('Paciente registrado correctamente.')
      return nuevo
    },
    actualizarUsuario(id, cambios) {
      if (cambios.doc && db.usuarios.some((x) => x.doc === cambios.doc && x.id !== id)) {
        aviso('Ese documento ya pertenece a otro usuario.', 'error'); return false
      }
      setDb((d) => ({
        ...d,
        usuarios: d.usuarios.map((x) => {
          if (x.id !== id) return x
          const actualizado = { ...x, ...cambios }
          if (actualizado.rol === 'medico' && !actualizado.horario) actualizado.horario = { duracion: 20, dias: { 1: { manana: ['08:00', '12:00'], tarde: null }, 3: { manana: ['08:00', '12:00'], tarde: null }, 5: { manana: ['08:00', '12:00'], tarde: null } } }
          if (actualizado.rol === 'medico' && !actualizado.espId) actualizado.espId = d.especialidades[0].id
          return actualizado
        })
      }))
      aviso('Datos actualizados correctamente.')
      return true
    },
    eliminarUsuario(id) {
      setDb((d) => ({ ...d, usuarios: d.usuarios.filter((x) => x.id !== id) }))
      aviso('Usuario eliminado correctamente.')
    },
    /* --- horarios del médico --- */
    guardarHorario(medicoId, horario) {
      setDb((d) => ({ ...d, usuarios: d.usuarios.map((x) => (x.id !== medicoId ? x : { ...x, horario })) }))
      aviso('Horario guardado. Los pacientes ya ven los nuevos turnos.')
    },
    /* --- documentos e historia --- */
    subirDocumento({ pacienteId, tipo, titulo, detalle, archivo, autor }) {
      const registro = { id: nuevoId('h'), pacienteId, fecha: iso(HOY), tipo, titulo,
        autor, detalle: detalle || 'Sin descripción.', archivo: archivo || 'documento-' + iso(HOY) + '.pdf' }
      setDb((d) => ({ ...d, historia: [...d.historia, registro] }))
      aviso('Documento guardado en la historia clínica del paciente.')
    },
    /* --- especialidades --- */
    crearEspecialidad(nombre, desc) {
      setDb((d) => ({ ...d, especialidades: [...d.especialidades, { id: nuevoId('e'), nombre, desc, icono: 'pulso' }] }))
      aviso('Especialidad creada correctamente.')
    },
    eliminarEspecialidad(id) {
      setDb((d) => ({ ...d, especialidades: d.especialidades.filter((e) => e.id !== id) }))
      aviso('Especialidad eliminada.')
    }
  }

  const valor = { db, sesion, entrar, entrarDirecto, salir, aviso, avisos, modal, setModal, escala, setEscala, acciones, buscarUsuario: (id) => buscarUsuario(db, id) }
  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>
}
