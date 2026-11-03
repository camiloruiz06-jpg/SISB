import React from 'react'
import Icono from '../componentes/Icono'
import { useApp } from '../contexto/AppContext'

/** Formulario de registro de paciente. Lo usan el login, el auxiliar y el administrador. */
export default function FormularioPaciente({ alTerminar, alCancelar }) {
  const { acciones } = useApp()

  const enviar = (e) => {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.target).entries())
    const nuevo = acciones.registrarUsuario({
      doc: f.doc.trim(), clave: f.clave, nombre: f.nombre.trim(), nac: f.nac,
      tel: f.tel.trim(), municipio: f.municipio.trim(), vereda: f.vereda.trim(), eps: f.eps.trim()
    })
    if (nuevo) alTerminar(nuevo)
  }

  return (
    <>
      <p className="ayuda">Llena los datos. Los que tienen asterisco son obligatorios.</p>
      <form onSubmit={enviar} className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
        <label className="campo">Nombre completo *<input name="nombre" required placeholder="Ej: Ana Lucía Pérez" /></label>
        <label className="campo">Número de documento *<input name="doc" inputMode="numeric" required placeholder="Ej: 1045882331" /></label>
        <label className="campo">Fecha de nacimiento<input name="nac" type="date" /></label>
        <label className="campo">Teléfono o celular *<input name="tel" inputMode="tel" required placeholder="Ej: 310 455 2201" /></label>
        <label className="campo">Municipio *<input name="municipio" required placeholder="Ej: Repelón, Atlántico" /></label>
        <label className="campo">Vereda o corregimiento<input name="vereda" placeholder="Ej: Vereda Las Tablas" /></label>
        <label className="campo">EPS<input name="eps" placeholder="Ej: Mutual SER" /></label>
        <label className="campo">Contraseña *<input name="clave" type="password" required minLength={4} placeholder="Mínimo 4 caracteres" /></label>
        <div className="fila" style={{ gridColumn: '1/-1', justifyContent: 'flex-end' }}>
          <button type="button" className="btn secundario" onClick={alCancelar}>Cancelar</button>
          <button className="btn" type="submit"><Icono nombre="check" tam={20} /> Guardar</button>
        </div>
      </form>
    </>
  )
}
