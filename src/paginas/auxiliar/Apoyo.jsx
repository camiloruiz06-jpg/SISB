import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icono from '../../componentes/Icono'
import { useApp } from '../../contexto/AppContext'
import { listarCitas, buscarUsuario, buscarEspecialidad, nombreMedico } from '../../servicios/api'
import { HOY, iso, fechaLarga, hora12, saludo } from '../../datos/utiles'
import FormularioPaciente from '../FormularioPaciente'
import { FOTOS } from '../../datos/imagenes'

export default function Apoyo() {
  const { db, sesion, setModal } = useApp()
  const navegar = useNavigate()
  const [verTodas, setVerTodas] = useState(false)
  /* Solo las citas de hoy de los pacientes de su puesto: son a quienes el auxiliar acompaña. */
  const hoy = listarCitas(db, (c) => c.fecha === iso(HOY) && c.estado === 'programada' &&
    buscarUsuario(db, c.pacienteId)?.puesto === sesion.puesto)
  const mostradas = verTodas ? hoy : hoy.slice(0, 5)

  const registrar = () => setModal({
    titulo: 'Registrar un paciente',
    contenido: (cerrar) => <FormularioPaciente alTerminar={() => cerrar()} alCancelar={cerrar} />
  })

  return (
    <div className="vista">
      <div className="banner-foto" style={{ '--foto': `url(${FOTOS.consulta})` }}>
        <span className="tenue">{fechaLarga(iso(HOY))}</span>
        <h1>{saludo()}, {sesion.nombre.split(' ')[0]}</h1>
        {sesion.puesto && <span className="chip-lugar" style={{ marginTop: '.3rem' }}><Icono nombre="mapa" tam={16} /> {sesion.puesto}</span>}
      </div>

      <section className="seccion">
        <h2>¿Qué necesitas hacer?</h2>
        <div className="acciones-grandes">
          <button className="accion principal" onClick={registrar}>
            <span className="ic"><Icono nombre="usuario" tam={24} /></span>
            Registrar paciente<small>Cuando llega alguien nuevo al puesto</small>
          </button>
          <button className="accion" onClick={() => navegar('/auxiliar/agendar')}>
            <span className="ic"><Icono nombre="agendar" tam={24} /></span>
            Agendar una cita<small>En nombre del paciente</small>
          </button>
          <button className="accion" onClick={() => navegar('/auxiliar/subir')}>
            <span className="ic"><Icono nombre="subir" tam={24} /></span>
            Subir documentos<small>Exámenes, carnés, órdenes</small>
          </button>
          <button className="accion" onClick={() => navegar('/auxiliar/pacientes')}>
            <span className="ic"><Icono nombre="usuarios" tam={24} /></span>
            Ver pacientes<small>Datos e historia clínica</small>
          </button>
        </div>
      </section>

      <section className="seccion">
        <div className="entre">
          <h2>Citas de hoy en tu puesto</h2>
          {hoy.length > 0 && <span className="pill info">{hoy.length} cita{hoy.length === 1 ? '' : 's'}</span>}
        </div>
        {hoy.length ? (
          <div className="lista">
            {mostradas.map((c) => {
              const [h, ampm] = hora12(c.hora).split(/\s(.+)/)
              return (
                <div className="item" key={c.id}>
                  <span className="hora-caja">{h}<small>{ampm}</small></span>
                  <div className="cuerpo">
                    <b>{buscarUsuario(db, c.pacienteId).nombre}</b>
                    <span className="meta">{nombreMedico(buscarUsuario(db, c.medicoId))} · {buscarEspecialidad(db, c.espId).nombre}</span>
                    <p className="pequeno tenue">{c.motivo}</p>
                    <div className="fila" style={{ marginTop: '.4rem' }}>
                      <button className="btn pequeno secundario" onClick={() => navegar('/llamada/' + c.id)}>
                        <Icono nombre="video" tam={18} /> Acompañar en la llamada
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="vacio"><Icono nombre="calendario" tam={30} /><b>Hoy no hay citas programadas en tu puesto</b></div>
        )}
        {hoy.length > 5 && (
          <button className="btn fantasma" onClick={() => setVerTodas(!verTodas)}>
            {verTodas ? 'Ver menos' : 'Ver las ' + hoy.length + ' citas de hoy'}
          </button>
        )}
      </section>
    </div>
  )
}
