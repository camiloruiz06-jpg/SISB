import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Icono from '../componentes/Icono'
import { useApp } from '../contexto/AppContext'
import { buscarUsuario, buscarEspecialidad, nombreMedico, historiaDePaciente } from '../servicios/api'
import { fechaLarga, fechaCorta, hora12, iniciales } from '../datos/utiles'

/**
 * Sala de teleconsulta.
 * El video es una maqueta. Para la versión final se integra Jitsi Meet
 * generando la sala con el identificador que ya se muestra abajo.
 */
export default function Videollamada() {
  const { citaId } = useParams()
  const navegar = useNavigate()
  const { db, sesion, acciones, aviso, setModal } = useApp()
  const cita = db.citas.find((c) => c.id === citaId)

  const [segundos, setSegundos] = useState(0)
  const [micApagado, setMicApagado] = useState(false)
  const [camApagada, setCamApagada] = useState(false)
  const [diagnostico, setDiagnostico] = useState(cita?.diagnostico || '')
  const [notas, setNotas] = useState(cita?.notas || '')

  useEffect(() => {
    const t = setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  if (!cita) return <div className="vacio">Esa cita no existe.</div>

  const paciente = buscarUsuario(db, cita.pacienteId)
  const medico = buscarUsuario(db, cita.medicoId)
  const esProfesional = sesion.rol !== 'paciente'
  const otro = esProfesional ? paciente : medico
  const sala = 'sisb-' + cita.id + '-' + cita.fecha.replace(/-/g, '')
  const reloj = String(Math.floor(segundos / 60)).padStart(2, '0') + ':' + String(segundos % 60).padStart(2, '0')

  const volver = () => navegar(sesion.rol === 'paciente' ? '/paciente/citas' : sesion.rol === 'medico' ? '/medico' : '/auxiliar')

  const colgar = () => setModal({
    titulo: '¿Terminar la videollamada?', peligro: true, confirmar: 'Sí, terminar',
    cuerpo: <p>Se cerrará la sala. {sesion.rol === 'paciente'
      ? 'Podrás volver a entrar desde Mis citas si la cita sigue abierta.'
      : 'Recuerda guardar el diagnóstico antes de salir.'}</p>,
    alConfirmar: () => {
      if (sesion.rol === 'medico' && cita.estado === 'programada') acciones.cambiarEstadoCita(cita.id, 'atendida')
      aviso('Videollamada terminada.')
      volver()
    }
  })

  const guardar = () => {
    if (!diagnostico.trim()) return aviso('Escribe al menos el diagnóstico antes de guardar.', 'error')
    acciones.guardarConsulta(cita.id, diagnostico.trim(), notas.trim(), medico)
  }

  return (
    <div className="vista">
      <div className="entre">
        <div className="titulo-vista">
          <h1>Consulta en curso</h1>
          <span className="tenue">{buscarEspecialidad(db, cita.espId).nombre} · {fechaLarga(cita.fecha)} · {hora12(cita.hora)}</span>
        </div>
        <button className="btn secundario" onClick={volver}><Icono nombre="atras" tam={18} /> Salir de la pantalla</button>
      </div>

      <div className="llamada">
        <div>
          <div className="video-marco">
            <div className="stack" style={{ alignItems: 'center', gap: '.7rem' }}>
              <div className="avatar-grande">{iniciales(otro.nombre)}</div>
              <b>{esProfesional ? otro.nombre : nombreMedico(otro)}</b>
              <span className="pequeno" style={{ color: '#9DB2E0' }}>Conectado · calidad de video reducida por la señal</span>
            </div>
            <span className="reloj"><span className="punto-rojo" /><span>{reloj}</span></span>
            <span className="etiqueta">{esProfesional ? 'Paciente' : 'Profesional'}</span>
            <div className="mini-video">Tu cámara<br />(tú)</div>
          </div>

          <div className="controles-llamada">
            <button className="ctrl" aria-pressed={micApagado} title="Silenciar micrófono"
                    onClick={() => { setMicApagado(!micApagado); aviso(!micApagado ? 'Micrófono silenciado.' : 'Micrófono encendido.') }}>
              <Icono nombre="mic" tam={22} />
            </button>
            <button className="ctrl" aria-pressed={camApagada} title="Apagar cámara"
                    onClick={() => { setCamApagada(!camApagada); aviso(!camApagada ? 'Cámara apagada.' : 'Cámara encendida.') }}>
              <Icono nombre="video" tam={22} />
            </button>
            <button className="ctrl colgar" onClick={colgar}><Icono nombre="telefono" tam={20} /> Terminar</button>
          </div>
          <p className="ayuda" style={{ textAlign: 'center', marginTop: '.6rem' }}>
            Sala: <b className="num">{sala}</b> · Si se corta, vuelve a entrar con el mismo botón.
          </p>
        </div>

        <aside className="stack">
          <div className="card stack" style={{ gap: '.6rem' }}>
            <h3>{esProfesional ? 'Datos del paciente' : 'Datos de tu cita'}</h3>
            <Dato k="Nombre" v={paciente.nombre} />
            <Dato k="Documento" v={paciente.doc} />
            <Dato k="Lugar" v={paciente.municipio + (paciente.vereda ? ' · ' + paciente.vereda : '')} />
            <Dato k="EPS" v={paciente.eps || '—'} />
            <hr className="linea-sep" />
            <div className="dato">
              <span className="k">Motivo de la consulta</span>
              <span className="v" style={{ fontWeight: 400 }}>{cita.motivo}</span>
            </div>
          </div>

          {esProfesional ? (
            <>
              <div className="card stack" style={{ gap: '.6rem' }}>
                <h3>Historia reciente</h3>
                {historiaDePaciente(db, paciente.id).slice(0, 3).map((h) => (
                  <div className="dato" key={h.id}>
                    <span className="k">{fechaCorta(h.fecha)} · {h.tipo}</span>
                    <span className="v pequeno" style={{ fontWeight: 400 }}>{h.titulo} — {h.detalle}</span>
                  </div>
                ))}
              </div>
              <div className="card stack" style={{ gap: '.6rem' }}>
                <h3>Registrar la consulta</h3>
                <label className="campo">Diagnóstico
                  <textarea value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)}
                            placeholder="Ej: Cefalea tensional. Se descarta signo de alarma." />
                </label>
                <label className="campo">Notas y recomendaciones
                  <textarea value={notas} onChange={(e) => setNotas(e.target.value)}
                            placeholder="Ej: Hidratación, control en 15 días." />
                </label>
                <button className="btn ancho" onClick={guardar}>
                  <Icono nombre="check" tam={20} /> Guardar en la historia clínica
                </button>
              </div>
            </>
          ) : (
            <div className="card stack" style={{ gap: '.6rem' }}>
              <h3>Si tienes problemas</h3>
              <p className="pequeno">Si no te escuchan, toca el botón del micrófono. Si no te ven, toca el de la cámara.</p>
              <p className="pequeno">Si se cae la llamada, vuelve a entrar desde <b>Mis citas</b>.</p>
              <p className="pequeno">También puedes pedirle ayuda al auxiliar de tu puesto de salud.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

const Dato = ({ k, v }) => <div className="dato"><span className="k">{k}</span><span className="v">{v}</span></div>
