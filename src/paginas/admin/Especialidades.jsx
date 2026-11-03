import React from 'react'
import Icono from '../../componentes/Icono'
import { useApp } from '../../contexto/AppContext'
import { medicosDeEspecialidad, nombreMedico } from '../../servicios/api'

export default function Especialidades() {
  const { db, acciones, setModal, aviso } = useApp()

  const crear = () => setModal({
    titulo: 'Nueva especialidad',
    contenido: (cerrar) => (
      <form className="stack" onSubmit={(e) => {
        e.preventDefault()
        const f = Object.fromEntries(new FormData(e.target).entries())
        acciones.crearEspecialidad(f.nombre.trim(), f.desc.trim())
        cerrar()
      }}>
        <label className="campo">Nombre<input name="nombre" required placeholder="Ej: Odontología" /></label>
        <label className="campo">Descripción para el paciente
          <input name="desc" required placeholder="Ej: Dolor de muelas, limpieza" />
          <span className="ayuda">Usa palabras sencillas: así la ve el paciente cuando pide su cita.</span>
        </label>
        <div className="fila" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn fantasma" onClick={cerrar}>Cancelar</button>
          <button className="btn" type="submit">Crear especialidad</button>
        </div>
      </form>
    )
  })

  const eliminar = (e) => {
    if (medicosDeEspecialidad(db, e.id).length) return aviso('No puedes eliminarla: tiene profesionales asignados.', 'error')
    setModal({
      titulo: '¿Eliminar la especialidad?', peligro: true, confirmar: 'Sí, eliminar',
      cuerpo: <p>Se quitará <b>{e.nombre}</b> de la lista que ven los pacientes.</p>,
      alConfirmar: () => acciones.eliminarEspecialidad(e.id)
    })
  }

  return (
    <div className="vista">
      <div className="entre">
        <div className="titulo-vista">
          <h1>Especialidades</h1>
          <span className="tenue">{db.especialidades.length} especialidades · así las ve el paciente cuando pide una cita.</span>
        </div>
        <button className="btn" onClick={crear}><Icono nombre="agendar" tam={20} /> Nueva especialidad</button>
      </div>

      <div className="lista">
        {db.especialidades.map((e) => {
          const medicos = medicosDeEspecialidad(db, e.id)
          const n = medicos.length
          return (
            <div className="item" key={e.id} style={{ alignItems: 'center' }}>
              <span className="ic azul"><Icono nombre={e.icono} tam={20} /></span>
              <div className="cuerpo">
                <div className="fila" style={{ gap: '.5rem' }}>
                  <b>{e.nombre}</b>
                  <span className={'pill ' + (n ? 'info' : 'alerta')}>{n ? n + ' profesional' + (n === 1 ? '' : 'es') : 'Sin profesionales'}</span>
                </div>
                <span className="meta">{e.desc}</span>
                {n > 0 && <span className="tenue pequeno">{medicos.map((m) => nombreMedico(m)).join(' · ')}</span>}
              </div>
              <button className="iconbtn chico rojo" onClick={() => eliminar(e)}
                      title="Eliminar" aria-label={'Eliminar ' + e.nombre}>
                <Icono nombre="borrar" tam={18} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
