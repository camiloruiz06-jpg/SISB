import React, { useState } from 'react'
import Icono from '../componentes/Icono'
import { useApp } from '../contexto/AppContext'

/**
 * Formulario de registro. Lo usan el login (el paciente se registra solo),
 * el auxiliar (registra pacientes) y el administrador.
 * Con conRol, el administrador puede crear también médicos, auxiliares y admins (R.9-1).
 */
export default function FormularioPaciente({ alTerminar, alCancelar, conRol = false }) {
  const { db, acciones, usaSupabase } = useApp()
  const [rol, setRol] = useState('paciente')
  const [enviando, setEnviando] = useState(false)
  const minimoClave = usaSupabase ? 6 : 4   // Supabase Auth exige al menos 6 caracteres

  const enviar = async (e) => {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.target).entries())
    const limpio = (k) => (f[k] || '').trim()
    const datos = { rol, doc: limpio('doc'), clave: f.clave, nombre: limpio('nombre'), tel: limpio('tel') }
    if (rol === 'paciente') Object.assign(datos, { nac: f.nac, municipio: limpio('municipio'), vereda: limpio('vereda'), eps: limpio('eps') })
    if (rol === 'medico') Object.assign(datos, { titulo: f.titulo, espId: f.espId, registro: limpio('registro') })
    if (rol === 'auxiliar') Object.assign(datos, { puesto: limpio('puesto'), municipio: limpio('municipio') })
    if (rol === 'admin') Object.assign(datos, { cargo: 'Administrador del sistema' })
    setEnviando(true)
    const nuevo = await acciones.registrarUsuario(datos)
    setEnviando(false)
    if (nuevo) alTerminar(nuevo)
  }

  return (
    <>
      <p className="ayuda">Llena los datos. Los que tienen asterisco son obligatorios.</p>
      <form onSubmit={enviar} className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
        {conRol && (
          <label className="campo" style={{ gridColumn: '1/-1' }}>Tipo de usuario *
            <select value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="paciente">Paciente</option>
              <option value="medico">Profesional de la salud</option>
              <option value="auxiliar">Auxiliar de salud</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
        )}
        <label className="campo">Nombre completo *<input name="nombre" required placeholder="Ej: Ana Lucía Pérez" /></label>
        <label className="campo">Número de documento *<input name="doc" inputMode="numeric" required pattern="[0-9]{5,12}" title="Solo números, sin puntos" placeholder="Ej: 1045882331" /></label>
        <label className="campo">Teléfono o celular *<input name="tel" inputMode="tel" required placeholder="Ej: 310 455 2201" /></label>

        {rol === 'paciente' && <>
          <label className="campo">Fecha de nacimiento<input name="nac" type="date" /></label>
          <label className="campo">Municipio *<input name="municipio" required placeholder="Ej: Repelón, Atlántico" /></label>
          <label className="campo">Vereda o corregimiento<input name="vereda" placeholder="Ej: Vereda Las Tablas" /></label>
          <label className="campo">EPS<input name="eps" placeholder="Ej: Mutual SER" /></label>
        </>}

        {rol === 'medico' && <>
          <label className="campo">Título
            <select name="titulo" defaultValue="Dr."><option>Dr.</option><option>Dra.</option></select>
          </label>
          <label className="campo">Especialidad *
            <select name="espId" required defaultValue={db.especialidades[0]?.id}>
              {db.especialidades.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </label>
          <label className="campo">Registro médico<input name="registro" placeholder="Ej: RM 88-2214" /></label>
        </>}

        {rol === 'auxiliar' && <>
          <label className="campo">Puesto de salud *<input name="puesto" required placeholder="Ej: Puesto de salud Luruaco" /></label>
          <label className="campo">Municipio *<input name="municipio" required placeholder="Ej: Luruaco, Atlántico" /></label>
        </>}

        <label className="campo">Contraseña *
          <input name="clave" type="password" required minLength={minimoClave} placeholder={'Mínimo ' + minimoClave + ' caracteres'} />
        </label>
        <div className="fila" style={{ gridColumn: '1/-1', justifyContent: 'flex-end' }}>
          <button type="button" className="btn fantasma" onClick={alCancelar}>Cancelar</button>
          <button className="btn" type="submit" disabled={enviando}>
            <Icono nombre="check" tam={20} /> {enviando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </>
  )
}
