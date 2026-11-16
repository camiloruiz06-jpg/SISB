import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { datosIniciales } from '../datos/mock'
import { nuevoId, iso, HOY } from '../datos/utiles'
import { autenticar, buscarUsuario, horaOcupada, buscarEspecialidad, nombreMedico } from '../servicios/api'
import { usaSupabase } from '../servicios/supabase'
import { CLAVE_DEMO_SUPABASE } from '../servicios/mapeo'
import * as repo from '../servicios/repositorio'

/* ===========================================================
   Estado global de la aplicación: sesión, datos, avisos y modales.
   Cualquier pantalla lo usa con:   const { db, sesion, acciones } = useApp()

   Funciona en dos modos (ver servicios/supabase.js):
   - LOCAL: los datos viven en memoria (se reinician al recargar).
   - SUPABASE: cada acción actualiza la pantalla al instante y luego
     se guarda en la base. Si la base la rechaza, se avisa y se
     vuelven a cargar los datos reales.
   =========================================================== */

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

const VACIO = { especialidades: [], usuarios: [], citas: [], historia: [], tramites: [], formulas: [] }
const MEDICO_NUEVO = { duracion: 20, dias: { 1: { manana: ['08:00', '12:00'], tarde: null }, 3: { manana: ['08:00', '12:00'], tarde: null }, 5: { manana: ['08:00', '12:00'], tarde: null } } }

export function ProveedorApp({ children }) {
  const [db, setDb] = useState(() => (usaSupabase ? VACIO : datosIniciales()))
  const [sesionId, setSesionId] = useState(null)
  const [cargando, setCargando] = useState(usaSupabase) // en Supabase, primero se revisa si había sesión abierta
  const [avisos, setAvisos] = useState([])
  const [modal, setModal] = useState(null)
  const [escala, setEscala] = useState('normal')
  const sesionRef = useRef(null)

  // La sesión siempre se lee de la base, así nunca queda desactualizada.
  const sesion = useMemo(() => (sesionId ? db.usuarios.find((u) => u.id === sesionId) : null), [db, sesionId])
  sesionRef.current = sesion

  /* ---------- avisos ---------- */
  const aviso = (texto, tipo = 'ok') => {
    const id = Math.random().toString(36).slice(2)
    setAvisos((a) => [...a, { id, texto, tipo }])
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 3800)
  }
  const bienvenida = (u) => aviso('Bienvenido, ' + (u.rol === 'medico' ? nombreMedico(u) : u.nombre.split(' ')[0]) + '.')

  /* ---------- sincronización con Supabase ---------- */
  const abrirSesion = async (usuario) => {
    setDb(await repo.cargarTodo(usuario))
    setSesionId(usuario.id)
  }
  const recargar = async () => {
    if (sesionRef.current) setDb(await repo.cargarTodo(sesionRef.current))
  }
  /** En modo Supabase guarda en la base; si falla, avisa y recarga. En modo local no hace nada. */
  const guardar = (tarea) => {
    if (!usaSupabase) return
    tarea().catch((e) => { aviso(e.message, 'error'); recargar().catch(() => {}) })
  }

  // Al abrir la app con Supabase: si el navegador ya tenía sesión, se retoma.
  useEffect(() => {
    if (!usaSupabase) return
    repo.sesionGuardada()
      .then((u) => (u ? abrirSesion(u) : null))
      .catch((e) => aviso('No se pudo conectar con la base de datos: ' + e.message, 'error'))
      .finally(() => setCargando(false))
  }, [])

  /* ---------- sesión ---------- */
  const entrar = async (documento, clave, rol) => {
    if (!usaSupabase) {
      const { usuario, error } = autenticar(db, documento, clave, rol)
      if (error) { aviso(error, 'error'); return null }
      setSesionId(usuario.id); bienvenida(usuario)
      return usuario
    }
    try {
      const usuario = await repo.iniciarSesion(documento, clave)
      if (usuario.rol !== rol) {
        await repo.cerrarSesion()
        aviso('Ese documento no corresponde al perfil seleccionado. Cambia el perfil arriba.', 'error')
        return null
      }
      await abrirSesion(usuario); bienvenida(usuario)
      return usuario
    } catch (e) { aviso(e.message, 'error'); return null }
  }
  /** Entrada directa con un usuario de prueba (o justo después de registrarse). */
  const entrarDirecto = async (usuario) => {
    if (!usaSupabase) { setSesionId(usuario.id); bienvenida(usuario); return usuario }
    if (sesionRef.current?.id === usuario.id) { bienvenida(usuario); return usuario }
    return entrar(usuario.doc, CLAVE_DEMO_SUPABASE, usuario.rol)
  }
  const salir = () => {
    setSesionId(null); aviso('Sesión cerrada.')
    if (usaSupabase) { setDb(VACIO); repo.cerrarSesion().catch(() => {}) }
  }

  /* ---------- acciones sobre los datos ---------- */
  const acciones = {
    /* --- citas --- */
    agendarCita({ pacienteId, medicoId, espId, fecha, hora, motivo }) {
      if (horaOcupada(db, medicoId, fecha, hora)) { aviso('Esa hora se acaba de ocupar. Elige otra.', 'error'); return false }
      const cita = { id: nuevoId('c'), pacienteId, medicoId, espId, fecha, hora,
        motivo: motivo || 'Sin motivo escrito.', estado: 'programada', modo: 'videollamada' }
      setDb((d) => ({ ...d, citas: [...d.citas, cita] }))
      guardar(() => repo.insertar('citas', cita))
      return true
    },
    reprogramarCita(citaId, fecha, hora, motivo) {
      const cita = db.citas.find((c) => c.id === citaId)
      if (horaOcupada(db, cita.medicoId, fecha, hora)) { aviso('Esa hora se acaba de ocupar. Elige otra.', 'error'); return false }
      const cambios = { fecha, hora, motivo: motivo || cita.motivo }
      setDb((d) => ({ ...d, citas: d.citas.map((c) => (c.id === citaId ? { ...c, ...cambios } : c)) }))
      guardar(() => repo.actualizar('citas', citaId, cambios))
      return true
    },
    cambiarEstadoCita(citaId, estado) {
      setDb((d) => ({ ...d, citas: d.citas.map((c) => (c.id === citaId ? { ...c, estado } : c)) }))
      guardar(() => repo.actualizar('citas', citaId, { estado }))
    },
    /* --- consulta médica: guarda en la cita y en la historia clínica --- */
    guardarConsulta(citaId, diagnostico, notas, medico) {
      const cita = db.citas.find((c) => c.id === citaId)
      const registro = {
        id: nuevoId('h'), pacienteId: cita.pacienteId, fecha: cita.fecha, tipo: 'consulta',
        titulo: buscarEspecialidad(db, cita.espId).nombre + ' — teleconsulta',
        autor: nombreMedico(medico), detalle: diagnostico + (notas ? ' ' + notas : '')
      }
      const cambios = { diagnostico, notas, estado: 'atendida' }
      setDb((d) => ({
        ...d,
        citas: d.citas.map((c) => (c.id === citaId ? { ...c, ...cambios } : c)),
        historia: [...d.historia, registro]
      }))
      guardar(async () => { await repo.actualizar('citas', citaId, cambios); await repo.insertar('historia', registro) })
      aviso('Consulta guardada en la historia clínica del paciente.')
    },
    /* --- usuarios ---
       Registra un paciente (o, si lo hace el admin, cualquier rol).
       Devuelve una promesa con el usuario nuevo, o null si no se pudo. */
    async registrarUsuario({ clave, ...datos }) {
      if (db.usuarios.some((x) => x.doc === datos.doc)) { aviso('Ese documento ya está registrado en el sistema.', 'error'); return null }
      const base = { rol: 'paciente', ...datos }
      if (base.rol === 'medico') { base.horario = base.horario || MEDICO_NUEVO; base.espId = base.espId || db.especialidades[0]?.id }
      const textoOk = base.rol === 'paciente' ? 'Paciente registrado correctamente.' : 'Usuario creado correctamente.'

      if (!usaSupabase) {
        const nuevo = { id: nuevoId('u'), puesto: '—', ...base, clave }
        setDb((d) => ({ ...d, usuarios: [...d.usuarios, nuevo] }))
        aviso(textoOk)
        return nuevo
      }
      try {
        let nuevo
        if (!sesionRef.current) {
          nuevo = await repo.registrarse(base, clave)     // el paciente se registra solo en el login
          sesionRef.current = nuevo                        // así entrarDirecto no vuelve a iniciar sesión
          await abrirSesion(nuevo)
        } else {
          nuevo = await repo.crearUsuarioConCuenta(base, clave) // el personal crea la cuenta de otra persona
          setDb((d) => ({ ...d, usuarios: [...d.usuarios, nuevo] }))
        }
        aviso(textoOk)
        return nuevo
      } catch (e) { aviso(e.message, 'error'); return null }
    },
    actualizarUsuario(id, cambios) {
      if (cambios.doc && db.usuarios.some((x) => x.doc === cambios.doc && x.id !== id)) {
        aviso('Ese documento ya pertenece a otro usuario.', 'error'); return false
      }
      const actual = db.usuarios.find((x) => x.id === id)
      const extra = {}
      if ((cambios.rol || actual.rol) === 'medico') {
        if (!actual.horario) extra.horario = MEDICO_NUEVO
        if (!actual.espId) extra.espId = db.especialidades[0]?.id
      }
      setDb((d) => ({ ...d, usuarios: d.usuarios.map((x) => (x.id === id ? { ...x, ...cambios, ...extra } : x)) }))
      guardar(() => repo.actualizar('usuarios', id, { ...cambios, ...extra }))
      aviso('Datos actualizados correctamente.')
      return true
    },
    /* --- recuperar contraseña (R.1-3) ---
       En modo local se confirma la identidad con el documento y el teléfono registrado.
       Con Supabase el cambio lo hace el personal del puesto de salud (ver Login.jsx). */
    restablecerClave(doc, tel, clave) {
      const numeros = (t) => (t || '').replace(/\D/g, '')
      const u = db.usuarios.find((x) => x.doc === doc.trim())
      if (!u || !numeros(tel) || numeros(u.tel) !== numeros(tel)) {
        aviso('El documento y el teléfono no coinciden con ningún usuario.', 'error'); return false
      }
      setDb((d) => ({ ...d, usuarios: d.usuarios.map((x) => (x.id === u.id ? { ...x, clave } : x)) }))
      aviso('Contraseña cambiada. Ya puedes entrar.')
      return true
    },
    eliminarUsuario(id) {
      setDb((d) => ({ ...d, usuarios: d.usuarios.filter((x) => x.id !== id) }))
      guardar(() => repo.eliminar('usuarios', id))
      aviso('Usuario eliminado correctamente.')
    },
    /* --- horarios del médico --- */
    guardarHorario(medicoId, horario) {
      setDb((d) => ({ ...d, usuarios: d.usuarios.map((x) => (x.id !== medicoId ? x : { ...x, horario })) }))
      guardar(() => repo.actualizar('usuarios', medicoId, { horario }))
      aviso('Horario guardado. Los pacientes ya ven los nuevos turnos.')
    },
    /* --- documentos e historia ---
       "archivo" es el File elegido; en Supabase se sube al bucket privado. */
    subirDocumento({ pacienteId, tipo, titulo, detalle, archivo, autor }) {
      const registro = { id: nuevoId('h'), pacienteId, fecha: iso(HOY), tipo, titulo, autor,
        detalle: detalle || 'Sin descripción.', archivo: archivo ? archivo.name : 'documento-' + iso(HOY) + '.pdf' }
      setDb((d) => ({ ...d, historia: [...d.historia, registro] }))
      guardar(async () => {
        const archivoRuta = archivo ? await repo.subirArchivo(pacienteId, archivo) : undefined
        await repo.insertar('historia', { ...registro, archivoRuta })
      })
      aviso('Documento guardado en la historia clínica del paciente.')
    },
    /* --- especialidades --- */
    crearEspecialidad(nombre, desc) {
      const esp = { id: nuevoId('e'), nombre, desc, icono: 'pulso' }
      setDb((d) => ({ ...d, especialidades: [...d.especialidades, esp] }))
      guardar(() => repo.insertar('especialidades', esp))
      aviso('Especialidad creada correctamente.')
    },
    eliminarEspecialidad(id) {
      setDb((d) => ({ ...d, especialidades: d.especialidades.filter((e) => e.id !== id) }))
      guardar(() => repo.eliminar('especialidades', id))
      aviso('Especialidad eliminada.')
    }
  }

  const valor = { db, sesion, cargando, usaSupabase, entrar, entrarDirecto, salir, aviso, avisos, modal, setModal, escala, setEscala, acciones, buscarUsuario: (id) => buscarUsuario(db, id) }
  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>
}
