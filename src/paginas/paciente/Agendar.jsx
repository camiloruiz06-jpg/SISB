import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Icono from '../../componentes/Icono'
import { useApp } from '../../contexto/AppContext'
import { buscarUsuario, buscarEspecialidad, medicosDeEspecialidad, horasDelDia, nombreMedico, diasDeAtencion } from '../../servicios/api'
import { proximosDias, desdeIso, fechaLarga, hora12, DOW, MESES, iniciales } from '../../datos/utiles'
import FormularioPaciente from '../FormularioPaciente'
import BuscadorPaciente from '../../componentes/BuscadorPaciente'

const PASOS = ['Especialidad', 'Profesional', 'Día y hora', 'Confirmar']

/**
 * Asistente de 4 pasos para pedir una cita.
 * Lo usan el paciente (para sí mismo) y el auxiliar (en nombre de un paciente).
 * Si llega con state.reprograma, cambia la fecha de una cita existente.
 */
export default function Agendar() {
  const { db, sesion, acciones, aviso, setModal } = useApp()
  const navegar = useNavigate()
  const { state } = useLocation()
  const reprograma = state?.reprograma ? db.citas.find((c) => c.id === state.reprograma) : null
  const esAuxiliar = sesion.rol === 'auxiliar'

  const [paso, setPaso] = useState(reprograma ? 3 : 1)
  const [espId, setEspId] = useState(reprograma?.espId || null)
  const [medicoId, setMedicoId] = useState(reprograma?.medicoId || null)
  const [fecha, setFecha] = useState(null)
  const [hora, setHora] = useState(null)
  const [motivo, setMotivo] = useState(reprograma?.motivo || '')
  const [pacienteId, setPacienteId] = useState(esAuxiliar ? (reprograma?.pacienteId || null) : sesion.id)

  const dias = proximosDias(21)
  const diaElegido = fecha || dias.find((f) => horasDelDia(db, medicoId, f).some((h) => h.libre)) || dias[0]
  const horas = medicoId ? horasDelDia(db, medicoId, diaElegido) : []

  /* --- el auxiliar primero escoge a quién le agenda --- */
  if (esAuxiliar && !pacienteId) {
    const registrar = () => setModal({
      titulo: 'Registrar un paciente',
      contenido: (cerrar) => <FormularioPaciente alTerminar={(n) => { cerrar(); setPacienteId(n.id) }} alCancelar={cerrar} />
    })
    return (
      <div className="vista">
        <div className="titulo-vista">
          <h1>Agendar una cita</h1>
          <span className="tenue">Como auxiliar puedes pedir la cita en nombre del paciente.</span>
        </div>
        <section className="seccion" style={{ maxWidth: 680 }}>
          <h2>¿Para cuál paciente es la cita?</h2>
          <BuscadorPaciente alElegir={(p) => setPacienteId(p.id)} alRegistrar={registrar} />
          <div className="separador">¿Es la primera vez que viene?</div>
          <button className="btn secundario" onClick={registrar}>
            <Icono nombre="agendar" tam={20} /> Registrar un paciente nuevo
          </button>
        </section>
      </div>
    )
  }

  const confirmar = () => {
    const ok = reprograma
      ? acciones.reprogramarCita(reprograma.id, diaElegido, hora, motivo)
      : acciones.agendarCita({ pacienteId, medicoId, espId, fecha: diaElegido, hora, motivo })
    if (!ok) return
    aviso(reprograma
      ? 'Cita cambiada para el ' + fechaLarga(diaElegido) + ' a las ' + hora12(hora) + '.'
      : '¡Listo! Tu cita quedó agendada para el ' + fechaLarga(diaElegido) + ' a las ' + hora12(hora) + '.')
    navegar(sesion.rol === 'paciente' ? '/paciente/citas' : '/auxiliar')
  }

  const puedeSeguir = (paso === 1 && espId) || (paso === 2 && medicoId) || (paso === 3 && diaElegido && hora)

  return (
    <div className="vista">
      <div className="titulo-vista">
        <h1>{reprograma ? 'Cambiar la cita' : 'Pedir una cita'}</h1>
        <span className="tenue">Paso {paso} de 4 · {PASOS[paso - 1]}</span>
      </div>

      {esAuxiliar && !reprograma && (
        <div className="item" style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius)', alignItems: 'center' }}>
          <span className="avatar" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>{iniciales(buscarUsuario(db, pacienteId).nombre)}</span>
          <div className="cuerpo">
            <span className="tenue pequeno">Agendando para</span>
            <b>{buscarUsuario(db, pacienteId).nombre} · C.C. {buscarUsuario(db, pacienteId).doc}</b>
          </div>
          <button className="btn pequeno fantasma" onClick={() => { setPacienteId(null); setPaso(1) }}>Cambiar</button>
        </div>
      )}

      <div className="pasos">
        {PASOS.map((t, i) => (
          <React.Fragment key={t}>
            <span className="paso" data-estado={paso === i + 1 ? 'activo' : paso > i + 1 ? 'hecho' : ''}>
              <span className="n">{paso > i + 1 ? '✓' : i + 1}</span><span>{t}</span>
            </span>
            {i < 3 && <span className="paso-sep" />}
          </React.Fragment>
        ))}
      </div>

      {paso === 1 && (
        <div className="card stack">
          <h2>¿Qué necesitas?</h2>
          <p className="ayuda">Toca la opción que más se parezca a tu caso. Si no sabes cuál elegir, escoge <b>Medicina general</b>.</p>
          <div className="opciones">
            {db.especialidades.map((e) => {
              const n = medicosDeEspecialidad(db, e.id).length
              return (
                <button key={e.id} className="opcion" aria-pressed={espId === e.id} disabled={!n}
                        style={n ? undefined : { opacity: .45 }}
                        onClick={() => { setEspId(e.id); setMedicoId(null) }}>
                  <span className="ic"><Icono nombre={e.icono} tam={20} /></span>
                  <span><b>{e.nombre}</b><small>{e.desc}{n ? '' : ' — sin profesionales por ahora'}</small></span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {paso === 2 && (
        <div className="card stack">
          <h2>Elige el profesional</h2>
          <p className="ayuda">Todos atienden por videollamada.</p>
          <div className="opciones">
            {medicosDeEspecialidad(db, espId).map((m) => (
              <button key={m.id} className="opcion" aria-pressed={medicoId === m.id}
                      onClick={() => { setMedicoId(m.id); setFecha(null); setHora(null) }}>
                <span className="ic">{iniciales(m.nombre)}</span>
                <span>
                  <b>{nombreMedico(m)}</b>
                  <small>{buscarEspecialidad(db, m.espId).nombre} · Atiende {diasDeAtencion(m.horario).map((d) => DOW[d].slice(0, 3)).join(', ')} · consultas de {m.horario.duracion} min</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {paso === 3 && (
        <div className="card stack">
          <h2>Elige el día</h2>
          <div className="dias">
            {dias.map((f) => {
              const d = desdeIso(f)
              const hay = horasDelDia(db, medicoId, f).some((h) => h.libre)
              return (
                <button key={f} className="dia-chip" aria-pressed={diaElegido === f} disabled={!hay}
                        style={hay ? undefined : { opacity: .3 }}
                        onClick={() => { setFecha(f); setHora(null) }}>
                  <span className="dow">{DOW[d.getDay()].slice(0, 3)}</span>
                  <span className="dd num">{d.getDate()}</span>
                  <span className="dow">{MESES[d.getMonth()].slice(0, 3)}</span>
                </button>
              )
            })}
          </div>
          <hr className="linea-sep" />
          <h2>Elige la hora</h2>
          {horas.length ? (
            <div className="horas">
              {horas.map((h) => (
                <button key={h.hora} className="hora" aria-pressed={hora === h.hora} disabled={!h.libre}
                        onClick={() => setHora(h.hora)}>
                  {hora12(h.hora)}
                </button>
              ))}
            </div>
          ) : (
            <div className="vacio">
              <Icono nombre="reloj" tam={28} /><b>Ese día no hay atención</b>
              <p className="pequeno">Elige otro día en la fila de arriba.</p>
            </div>
          )}
          <hr className="linea-sep" />
          <label className="campo">Cuéntanos qué te pasa
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Ej: Tengo dolor de cabeza hace cinco días y me mareo al levantarme." />
            <span className="ayuda">Escríbelo con tus palabras. Esto le sirve al médico antes de la llamada.</span>
          </label>
        </div>
      )}

      {paso === 4 && (
        <div className="card destacada stack">
          <h2>Revisa antes de confirmar</h2>
          <div className="datos-grid">
            <Dato k="Paciente" v={buscarUsuario(db, pacienteId).nombre} />
            <Dato k="Especialidad" v={buscarEspecialidad(db, espId).nombre} />
            <Dato k="Profesional" v={nombreMedico(buscarUsuario(db, medicoId))} />
            <Dato k="Día" v={fechaLarga(diaElegido)} />
            <Dato k="Hora" v={hora12(hora)} />
            <Dato k="Modo" v="Videollamada" />
          </div>
          <div className="card" style={{ background: 'var(--surface-2)' }}>
            <span className="k tenue pequeno" style={{ fontWeight: 700, textTransform: 'uppercase' }}>Motivo</span>
            <p>{motivo || '(sin escribir)'}</p>
          </div>
          <div className="item" style={{ background: 'var(--info-soft)', border: 'none' }}>
            <span className="ic azul"><Icono nombre="antena" tam={20} /></span>
            <div className="cuerpo">
              <b>El día de la cita</b>
              <span className="meta">Entra a la plataforma 10 minutos antes y toca el botón verde de videollamada. Si se te cae el internet, vuelve a entrar y toca el mismo botón.</span>
            </div>
          </div>
        </div>
      )}

      <div className="fila" style={{ justifyContent: 'space-between' }}>
        {paso > 1
          ? <button className="btn secundario" onClick={() => setPaso(paso - 1)}><Icono nombre="atras" tam={20} /> Volver</button>
          : <span />}
        {paso < 4
          ? <button className="btn" disabled={!puedeSeguir} onClick={() => setPaso(paso + 1)}>Continuar</button>
          : <button className="btn" onClick={confirmar}>
              <Icono nombre="check" tam={20} /> {reprograma ? 'Guardar el cambio' : 'Confirmar la cita'}
            </button>}
      </div>
    </div>
  )
}

const Dato = ({ k, v }) => (
  <div className="dato"><span className="k">{k}</span><span className="v">{v}</span></div>
)
