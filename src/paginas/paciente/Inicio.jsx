import React from 'react'
import { useNavigate } from 'react-router-dom'
import Icono from '../../componentes/Icono'
import ItemHistoria from '../../componentes/ItemHistoria'
import { useApp } from '../../contexto/AppContext'
import { listarCitas, buscarUsuario, buscarEspecialidad, nombreMedico, historiaDePaciente, tramitesDePaciente } from '../../servicios/api'
import { FOTOS } from '../../datos/imagenes'
import { HOY, iso, desdeIso, fechaLarga, relativo, hora12, saludo, MESES } from '../../datos/utiles'

export default function Inicio() {
  const { db, sesion } = useApp()
  const navegar = useNavigate()

  const proxima = listarCitas(db, (c) => c.pacienteId === sesion.id && c.estado === 'programada' && c.fecha >= iso(HOY))[0]
  const pendientes = tramitesDePaciente(db, sesion.id).filter((t) => t.estado === 'pendiente')
  const ultimos = historiaDePaciente(db, sesion.id).slice(0, 2)

  return (
    <div className="vista">
      <div className="banner-foto" style={{ '--foto': `url(${FOTOS.consulta})` }}>
        <span className="tenue">{fechaLarga(iso(HOY))}</span>
        <h1>{saludo()}, {sesion.nombre.split(' ')[0]}</h1>
        <span className="tenue">Tu salud, cerca de casa.</span>
        {sesion.municipio && <span className="chip-lugar" style={{ marginTop: '.3rem' }}><Icono nombre="mapa" tam={16} /> {sesion.vereda || sesion.municipio}</span>}
      </div>

      {proxima ? <TarjetaProxima cita={proxima} /> : (
        <div className="vacio">
          <Icono nombre="calendario" tam={32} />
          <b>No tienes citas pendientes</b>
          <p className="pequeno">Cuando necesites atención médica, pide tu cita aquí mismo.</p>
          <button className="btn" onClick={() => navegar('/paciente/agendar')}>
            <Icono nombre="agendar" tam={20} /> Pedir una cita
          </button>
        </div>
      )}

      <div>
        <h2 style={{ marginBottom: '.6rem' }}>¿Qué necesitas hacer?</h2>
        <div className="acciones-grandes">
          <Accion icono="agendar" titulo="Pedir una cita" nota="Elige la especialidad y el día" ir="/paciente/agendar" />
          <Accion icono="calendario" titulo="Ver mis citas" nota="Cambiar o cancelar" ir="/paciente/citas" />
          <Accion icono="archivo" titulo="Mi historia clínica" nota="Consultas y resultados" ir="/paciente/perfil?tab=historia" />
          <Accion icono="alerta" titulo="Mis trámites"
                  nota={pendientes.length + ' pendiente' + (pendientes.length === 1 ? '' : 's')}
                  ir="/paciente/perfil?tab=tramites" />
        </div>
      </div>

      {pendientes.length > 0 && (
        <div className="card destacada stack" style={{ gap: '.7rem' }}>
          <div className="entre">
            <h2>Te falta hacer esto</h2>
            <span className="pill aviso">{pendientes.length} pendiente{pendientes.length === 1 ? '' : 's'}</span>
          </div>
          <div className="lista">
            {pendientes.map((t) => (
              <div className="item" key={t.id} style={{ border: 'none', padding: '.4rem 0' }}>
                <span className="ic ambar"><Icono nombre="alerta" tam={20} /></span>
                <div className="cuerpo"><b>{t.titulo}</b><span className="meta">{t.detalle}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {ultimos.length > 0 && (
        <div className="stack" style={{ gap: '.6rem' }}>
          <div className="entre">
            <h2>Lo último en tu historia</h2>
            <button className="btn pequeno fantasma" onClick={() => navegar('/paciente/perfil?tab=historia')}>Ver todo</button>
          </div>
          <div className="lista">{ultimos.map((h) => <ItemHistoria key={h.id} h={h} />)}</div>
        </div>
      )}
    </div>
  )
}

function Accion({ icono, titulo, nota, ir }) {
  const navegar = useNavigate()
  return (
    <button className="accion" onClick={() => navegar(ir)}>
      <span className="ic"><Icono nombre={icono} tam={26} /></span>
      {titulo}
      <small>{nota}</small>
    </button>
  )
}

function TarjetaProxima({ cita }) {
  const { db } = useApp()
  const navegar = useNavigate()
  const medico = buscarUsuario(db, cita.medicoId)
  const d = desdeIso(cita.fecha)
  const esHoy = cita.fecha === iso(HOY)

  return (
    <div className="cita-proxima">
      <div className="entre">
        <h2>Tu próxima cita</h2>
        <span className={'pill ' + (esHoy ? 'ok' : 'info')}>{relativo(cita.fecha)}</span>
      </div>
      <div className="cita-fecha">
        <div className="caja-fecha">
          <div className="dia num">{d.getDate()}</div>
          <div className="mes">{MESES[d.getMonth()].slice(0, 3)}</div>
        </div>
        <div className="stack" style={{ gap: '.15rem', minWidth: 0 }}>
          <b style={{ fontSize: '1.1rem' }}>{hora12(cita.hora)} — {buscarEspecialidad(db, cita.espId).nombre}</b>
          <span className="tenue">Con {nombreMedico(medico)}</span>
          <span className="tenue pequeno">{fechaLarga(cita.fecha)} · Por videollamada</span>
        </div>
      </div>
      <div className="fila">
        <button className="btn" disabled={!esHoy} onClick={() => navegar('/llamada/' + cita.id)}>
          <Icono nombre="video" tam={20} /> Entrar a la videollamada
        </button>
        <button className="btn secundario" onClick={() => navegar('/paciente/citas')}>Ver detalles</button>
      </div>
      {!esHoy && <p className="ayuda">El botón de la videollamada se activa el mismo día de la cita.</p>}
    </div>
  )
}
