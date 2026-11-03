import React from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import Icono from './Icono'
import { useApp } from '../contexto/AppContext'
import { nombreMedico } from '../servicios/api'
import { iniciales } from '../datos/utiles'

/* Menú de cada rol. Cambiar aquí cambia la navegación de toda la app. */
export const MENUS = {
  paciente: [
    { to: '/paciente', txt: 'Inicio', icono: 'inicio', fin: true },
    { to: '/paciente/agendar', txt: 'Pedir cita', icono: 'agendar' },
    { to: '/paciente/citas', txt: 'Mis citas', icono: 'calendario' },
    { to: '/paciente/perfil', txt: 'Mi perfil', icono: 'usuario' }
  ],
  medico: [
    { to: '/medico', txt: 'Mi agenda', icono: 'calendario', fin: true },
    { to: '/medico/pacientes', txt: 'Pacientes', icono: 'usuarios' },
    { to: '/medico/horarios', txt: 'Mis horarios', icono: 'reloj' }
  ],
  auxiliar: [
    { to: '/auxiliar', txt: 'Apoyo', icono: 'inicio', fin: true },
    { to: '/auxiliar/agendar', txt: 'Agendar', icono: 'agendar' },
    { to: '/auxiliar/pacientes', txt: 'Pacientes', icono: 'usuarios' },
    { to: '/auxiliar/subir', txt: 'Documentos', icono: 'subir' }
  ],
  admin: [
    { to: '/admin', txt: 'Usuarios', icono: 'usuarios', fin: true },
    { to: '/admin/especialidades', txt: 'Especialidades', icono: 'ajustes' },
    { to: '/admin/resumen', txt: 'Resumen', icono: 'pulso' }
  ]
}

export const ROL_TXT = {
  paciente: 'Paciente',
  medico: 'Profesional de la salud',
  auxiliar: 'Auxiliar de salud',
  admin: 'Administrador'
}

/** Marco común: barra superior, menú y contenido de cada página. */
export default function Shell() {
  const { sesion, salir, escala, setEscala, setModal, aviso } = useApp()
  const navegar = useNavigate()

  const cambiarLetra = () => {
    const siguiente = escala === 'normal' ? 'grande' : escala === 'grande' ? 'extra' : 'normal'
    setEscala(siguiente)
    aviso('Tamaño de letra: ' + { normal: 'normal', grande: 'grande', extra: 'muy grande' }[siguiente] + '.')
  }

  const confirmarSalida = () => setModal({
    titulo: '¿Cerrar sesión?',
    cuerpo: <p>Vas a salir de la plataforma. Tus datos quedan guardados.</p>,
    confirmar: 'Sí, salir',
    alConfirmar: () => { salir(); navegar('/') }
  })

  return (
    <div className="shell">
      <header className="topbar">
        <div className="marca"><span className="logo"><Icono nombre="pulso" tam={20} /></span> SISB</div>

        {/* En computador el menú va aquí arriba; en celular el CSS lo baja a una barra fija inferior. */}
        <nav className="nav" aria-label="Secciones">
          {MENUS[sesion.rol].map((m) => (
            <NavLink key={m.to} to={m.to} end={m.fin}
                     className={({ isActive }) => (isActive ? 'activo' : '')}
                     style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <span className="nav-item" aria-current={isActive ? 'page' : undefined}>
                  <Icono nombre={m.icono} tam={22} />
                  <span>{m.txt}</span>
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="fila" style={{ gap: '.5rem', flexWrap: 'nowrap' }}>
          <button className="iconbtn" onClick={cambiarLetra} title="Cambiar tamaño de la letra" aria-label="Cambiar tamaño de la letra">
            <b style={{ fontSize: '.95rem' }}>A+</b>
          </button>
          <div className="usuario-chip">
            <div className="avatar">{iniciales(sesion.nombre)}</div>
            <div style={{ minWidth: 0 }}>
              <div className="nombre">{sesion.rol === 'medico' ? nombreMedico(sesion) : sesion.nombre}</div>
              <div className="rol-txt">{ROL_TXT[sesion.rol]}</div>
            </div>
          </div>
          <button className="iconbtn" onClick={confirmarSalida} title="Cerrar sesión" aria-label="Cerrar sesión">
            <Icono nombre="salir" tam={20} />
          </button>
        </div>
      </header>

      <div className="banda-conexion">
        <Icono nombre="antena" tam={15} /> Modo de baja conectividad activo — la plataforma carga solo lo necesario.
      </div>

      <main><Outlet /></main>
    </div>
  )
}
