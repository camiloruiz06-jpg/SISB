import React from 'react'
import { useNavigate } from 'react-router-dom'
import Icono from '../../componentes/Icono'
import { useApp } from '../../contexto/AppContext'
import { listarCitas, buscarUsuario, buscarEspecialidad, nombreMedico } from '../../servicios/api'
import { HOY, iso, fechaLarga, hora12, desdeIso, MESES } from '../../datos/utiles'

const ESTADOS = {
  programada: <span className="pill info">Programada</span>,
  atendida: <span className="pill ok">Atendida</span>,
  cancelada: <span className="pill alerta">Cancelada</span>,
  'no-asistio': <span className="pill aviso">No asistió</span>
}

export default function MisCitas() {
  const { db, sesion } = useApp()
  const navegar = useNavigate()

  const proximas = listarCitas(db, (c) => c.pacienteId === sesion.id && c.estado === 'programada' && c.fecha >= iso(HOY))
  const anteriores = listarCitas(db, (c) => c.pacienteId === sesion.id && (c.estado !== 'programada' || c.fecha < iso(HOY))).reverse()

  return (
    <div className="vista">
      <div className="titulo-vista">
        <h1>Mis citas</h1>
        <span className="tenue">Aquí ves lo que viene y lo que ya pasó.</span>
      </div>

      <section className="seccion">
        <h2>Próximas</h2>
        {proximas.length ? (
          <div className="lista">{proximas.map((c) => <Cita key={c.id} c={c} />)}</div>
        ) : (
          <div className="vacio">
            <Icono nombre="calendario" tam={30} /><b>No tienes citas próximas</b>
            <button className="btn" onClick={() => navegar('/paciente/agendar')}>Pedir una cita</button>
          </div>
        )}
      </section>

      <section className="seccion">
        <h2>Anteriores</h2>
        {anteriores.length
          ? <div className="lista">{anteriores.map((c) => <Cita key={c.id} c={c} pasada />)}</div>
          : <p className="tenue">Todavía no has tenido citas.</p>}
      </section>
    </div>
  )
}

function Cita({ c, pasada }) {
  const { db, acciones, setModal, aviso } = useApp()
  const navegar = useNavigate()
  const medico = buscarUsuario(db, c.medicoId)
  const esHoy = c.fecha === iso(HOY)
  const d = desdeIso(c.fecha)

  const cancelar = () => setModal({
    titulo: '¿Cancelar esta cita?', peligro: true,
    confirmar: 'Sí, cancelar la cita', cancelar: 'No, dejarla',
    cuerpo: (
      <>
        <p>{buscarEspecialidad(db, c.espId).nombre} con {nombreMedico(medico)}<br />
          {fechaLarga(c.fecha)} a las {hora12(c.hora)}.</p>
        <p style={{ marginTop: '.5rem' }}>La hora quedará libre para otra persona.</p>
      </>
    ),
    alConfirmar: () => { acciones.cambiarEstadoCita(c.id, 'cancelada'); aviso('Cita cancelada. La hora quedó libre.') }
  })

  return (
    <div className="item">
      <span className={'fecha-mini' + (pasada ? ' gris' : '')}>
        <b className="num">{d.getDate()}</b><small>{MESES[d.getMonth()].slice(0, 3)}</small>
      </span>
      <div className="cuerpo">
        <div className="entre" style={{ gap: '.4rem' }}>
          <b>{buscarEspecialidad(db, c.espId).nombre}</b>{ESTADOS[c.estado]}
        </div>
        <span className="meta">{hora12(c.hora)} · {nombreMedico(medico)}</span>
        <p className="pequeno tenue">{c.motivo}</p>
        {c.diagnostico && (
          <div className="nota">
            <b>Lo que dijo el médico</b>
            <p className="pequeno">{c.diagnostico}</p>
          </div>
        )}
        {!pasada && (
          <div className="fila" style={{ marginTop: '.4rem' }}>
            <button className="btn pequeno" disabled={!esHoy} onClick={() => navegar('/llamada/' + c.id)}>
              <Icono nombre="video" tam={18} /> Entrar a la llamada
            </button>
            <button className="btn pequeno secundario"
                    onClick={() => navegar('/paciente/agendar', { state: { reprograma: c.id } })}>
              <Icono nombre="reloj" tam={18} /> Cambiar fecha
            </button>
            <button className="btn pequeno fantasma rojo" onClick={cancelar}>
              <Icono nombre="equis" tam={18} /> Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
