import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useApp } from './contexto/AppContext'
import Shell from './componentes/Shell'
import Avisos from './componentes/Avisos'
import Modal from './componentes/Modal'

import Login from './paginas/Login'
import Videollamada from './paginas/Videollamada'

import InicioPaciente from './paginas/paciente/Inicio'
import Agendar from './paginas/paciente/Agendar'
import MisCitas from './paginas/paciente/MisCitas'
import Perfil from './paginas/paciente/Perfil'

import AgendaMedico from './paginas/medico/Agenda'
import Horarios from './paginas/medico/Horarios'
import Pacientes from './paginas/medico/Pacientes'

import Apoyo from './paginas/auxiliar/Apoyo'
import SubirDocumentos from './paginas/auxiliar/SubirDocumentos'

import Usuarios from './paginas/admin/Usuarios'
import Especialidades from './paginas/admin/Especialidades'
import Resumen from './paginas/admin/Resumen'

/** Bloquea las rutas privadas: si no hay sesión, devuelve al login. */
function Privada({ roles, children }) {
  const { sesion } = useApp()
  const ubicacion = useLocation()
  if (!sesion) return <Navigate to="/" replace state={{ desde: ubicacion.pathname }} />
  if (roles && !roles.includes(sesion.rol)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { sesion, escala } = useApp()

  return (
    <div data-escala={escala} style={{ minHeight: '100%' }}>
      <Routes>
        <Route path="/" element={sesion ? <Navigate to={'/' + sesion.rol} replace /> : <Login />} />

        {/* ----- Paciente ----- */}
        <Route path="/paciente" element={<Privada roles={['paciente']}><Shell /></Privada>}>
          <Route index element={<InicioPaciente />} />
          <Route path="agendar" element={<Agendar />} />
          <Route path="citas" element={<MisCitas />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>

        {/* ----- Médico ----- */}
        <Route path="/medico" element={<Privada roles={['medico']}><Shell /></Privada>}>
          <Route index element={<AgendaMedico />} />
          <Route path="pacientes" element={<Pacientes />} />
          <Route path="pacientes/:id" element={<Perfil />} />
          <Route path="horarios" element={<Horarios />} />
        </Route>

        {/* ----- Auxiliar de salud ----- */}
        <Route path="/auxiliar" element={<Privada roles={['auxiliar']}><Shell /></Privada>}>
          <Route index element={<Apoyo />} />
          <Route path="agendar" element={<Agendar />} />
          <Route path="pacientes" element={<Pacientes />} />
          <Route path="pacientes/:id" element={<Perfil />} />
          <Route path="subir" element={<SubirDocumentos />} />
        </Route>

        {/* ----- Administrador ----- */}
        <Route path="/admin" element={<Privada roles={['admin']}><Shell /></Privada>}>
          <Route index element={<Usuarios />} />
          <Route path="especialidades" element={<Especialidades />} />
          <Route path="resumen" element={<Resumen />} />
        </Route>

        {/* ----- Videollamada (cualquier rol con sesión) ----- */}
        <Route path="/llamada/:citaId" element={<Privada><Shell /></Privada>}>
          <Route index element={<Videollamada />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Avisos />
      <Modal />
    </div>
  )
}
