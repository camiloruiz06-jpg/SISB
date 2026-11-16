import React, { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Icono from '../../componentes/Icono'
import { useApp } from '../../contexto/AppContext'
import { buscarUsuario, buscarEspecialidad, medicosDeEspecialidad, horasDelDia, nombreMedico, diasDeAtencion, proximoTurno } from '../../servicios/api'
import { HOY, iso, sumaDias, proximosDias, desdeIso, fechaLarga, hora12, aMinutos, DOW, MESES, iniciales } from '../../datos/utiles'
import FormularioPaciente from '../FormularioPaciente'
import BuscadorPaciente from '../../componentes/BuscadorPaciente'

const PASOS = ['Especialidad', 'Profesional', 'Día y hora', 'Confirmar']
const DIAS_ADELANTE = 21
/* Motivos frecuentes: se tocan para no tener que escribir desde cero. */
const MOTIVOS = ['Dolor', 'Fiebre o gripa', 'Control', 'Revisar exámenes', 'Renovar la fórmula']

const Mayus = (t) => t[0].toUpperCase() + t.slice(1)
/* '2026-11-19' -> 'Hoy', 'Mañana' o 'Jue 19 nov' */
const diaCorto = (f) => {
  const d = desdeIso(f)
  const dif = Math.round((d - HOY) / 86400000)
  if (dif === 0) return 'Hoy'
  if (dif === 1) return 'Mañana'
  return Mayus(DOW[d.getDay()].slice(0, 3)) + ' ' + d.getDate() + ' ' + MESES[d.getMonth()].slice(0, 3)
}
const cuando = (turno) => diaCorto(turno.fecha) + ', ' + hora12(turno.hora)

/**
 * Asistente de 4 pasos para pedir una cita.
 * Lo usan el paciente (para sí mismo) y el auxiliar (en nombre de un paciente).
 * Si llega con state.reprograma, solo cambia el día y la hora de una cita existente.
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

  const dias = useMemo(() => proximosDias(DIAS_ADELANTE), [])

  /* Profesionales de la especialidad, primero el que tiene la cita más pronta. */
  const profesionales = useMemo(() => {
    if (!espId) return []
    const orden = (p) => (p.turno ? p.turno.fecha + p.turno.hora : 'z')
    return medicosDeEspecialidad(db, espId)
      .map((m) => ({ m, turno: proximoTurno(db, m.id, dias) }))
      .sort((a, b) => orden(a).localeCompare(orden(b)))
  }, [db, espId, dias])
  const masPronto = profesionales[0]?.turno ? profesionales[0] : null

  /* Calendario de semanas completas (de lunes a domingo) con las horas libres de cada día. */
  const calendario = useMemo(() => {
    if (!medicoId) return []
    const lunes = sumaDias(HOY, -((HOY.getDay() + 6) % 7))
    const total = Math.ceil(((HOY.getDay() + 6) % 7 + DIAS_ADELANTE) / 7) * 7
    return Array.from({ length: total }, (_, i) => {
      const f = iso(sumaDias(lunes, i))
      const fuera = !dias.includes(f)
      const turnos = fuera ? [] : horasDelDia(db, medicoId, f)
      return { f, fuera, turnos: turnos.length, libres: turnos.filter((h) => h.libre).length }
    })
  }, [db, medicoId, dias])

  const diaElegido = fecha || calendario.find((c) => c.libres)?.f || dias[0]
  const horas = medicoId ? horasDelDia(db, medicoId, diaElegido) : []
  const grupos = [
    { txt: 'En la mañana', icono: 'sol', horas: horas.filter((h) => aMinutos(h.hora) < 720) },
    { txt: 'En la tarde', icono: 'tarde', horas: horas.filter((h) => aMinutos(h.hora) >= 720) }
  ].filter((g) => g.horas.length)

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

  const paciente = buscarUsuario(db, pacienteId)
  const especialidad = espId ? buscarEspecialidad(db, espId) : null
  const medico = medicoId ? buscarUsuario(db, medicoId) : null

  const elegirEspecialidad = (id) => {
    if (id !== espId) { setMedicoId(null); setFecha(null); setHora(null) }
    setEspId(id); setPaso(2)
  }
  /* Si llega "turno" (la cita más pronta), el día y la hora quedan ya escogidos. */
  const elegirProfesional = (id, turno) => {
    if (id !== medicoId || turno) { setFecha(turno?.fecha || null); setHora(turno?.hora || null) }
    setMedicoId(id); setPaso(3)
  }
  const agregarMotivo = (t) => setMotivo((m) => (m.trim() ? m.trim() + '. ' + t : t))

  const confirmar = () => {
    const ok = reprograma
      ? acciones.reprogramarCita(reprograma.id, diaElegido, hora, motivo)
      : acciones.agendarCita({ pacienteId, medicoId, espId, fecha: diaElegido, hora, motivo })
    if (!ok) return
    aviso(reprograma
      ? 'Cita cambiada para el ' + fechaLarga(diaElegido) + ' a las ' + hora12(hora)
      : '¡Listo! Tu cita quedó agendada para el ' + fechaLarga(diaElegido) + ' a las ' + hora12(hora))
    navegar(sesion.rol === 'paciente' ? '/paciente/citas' : '/auxiliar')
  }

  const puedeSeguir = (paso === 1 && espId) || (paso === 2 && medicoId) || (paso === 3 && diaElegido && hora)
  /* Al cambiar una cita no se puede cambiar de especialidad ni de profesional. */
  const primerPaso = reprograma ? 3 : 1
  const volver = () => (paso > primerPaso ? setPaso(paso - 1) : navegar(-1))

  const enRango = calendario.filter((c) => !c.fuera)
  const mesIni = enRango.length ? desdeIso(enRango[0].f) : HOY
  const mesFin = enRango.length ? desdeIso(enRango[enRango.length - 1].f) : HOY
  const meses = Mayus(MESES[mesIni.getMonth()]) + (mesFin.getMonth() !== mesIni.getMonth() ? ' – ' + MESES[mesFin.getMonth()] : '')
  const libresDelDia = horas.filter((h) => h.libre).length

  return (
    <div className="vista">
      <div className="titulo-vista">
        <h1>{reprograma ? 'Cambiar la cita' : esAuxiliar ? 'Agendar una cita' : 'Pedir una cita'}</h1>
        <span className="tenue">
          {reprograma ? 'Escoge el nuevo día y la nueva hora.' : 'Son cuatro pasos cortos. Puedes devolverte cuando quieras.'}
        </span>
      </div>

      {esAuxiliar && !reprograma && (
        <div className="para-quien">
          <span className="avatar">{iniciales(paciente.nombre)}</span>
          <div className="cuerpo">
            <span className="tenue pequeno">Agendando para</span>
            <b>{paciente.nombre} · C.C. {paciente.doc}</b>
          </div>
          <button className="btn pequeno fantasma" onClick={() => { setPacienteId(null); setPaso(1) }}>Cambiar</button>
        </div>
      )}

      <nav className="pasos" aria-label="Pasos para pedir la cita">
        {PASOS.map((t, i) => {
          const n = i + 1
          const estado = paso === n ? 'activo' : paso > n ? 'hecho' : ''
          return (
            <React.Fragment key={t}>
              <button className="paso" data-estado={estado} aria-current={paso === n ? 'step' : undefined}
                      disabled={!(paso > n && n >= primerPaso)} onClick={() => setPaso(n)}>
                <span className="n">{paso > n ? <Icono nombre="check" tam={15} /> : n}</span><span>{t}</span>
              </button>
              {i < 3 && <span className="paso-sep" data-hecho={paso > n} />}
            </React.Fragment>
          )
        })}
      </nav>

      <div className="asistente" data-resumen={paso < 4}>
        <div className="stack" style={{ minWidth: 0 }}>
          {paso === 1 && (
            <section className="seccion">
              <div className="titulo-paso">
                <h2>¿Qué tipo de consulta necesitas?</h2>
                <p className="ayuda">Si no sabes cuál elegir, escoge <b>Medicina general</b>: el médico te orienta.</p>
              </div>
              <div className="elecciones">
                {db.especialidades.map((e) => {
                  const n = medicosDeEspecialidad(db, e.id).length
                  return (
                    <button key={e.id} className="eleccion" aria-pressed={espId === e.id} disabled={!n}
                            onClick={() => elegirEspecialidad(e.id)}>
                      <span className="ic"><Icono nombre={e.icono} tam={22} /></span>
                      <span className="eleccion-txt"><b>{e.nombre}</b><small>{e.desc}</small></span>
                      <span className="eleccion-meta">
                        <small>{n ? n + (n === 1 ? ' profesional' : ' profesionales') : 'Sin profesionales por ahora'}</small>
                      </span>
                      <Icono nombre="flecha" tam={18} />
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {paso === 2 && (
            <section className="seccion">
              <div className="titulo-paso">
                <h2>¿Con quién quieres la cita?</h2>
                <p className="ayuda">Profesionales de {especialidad.nombre.toLowerCase()}. Todos atienden por videollamada.</p>
              </div>
              {masPronto && (
                <button className="eleccion suelta" onClick={() => elegirProfesional(masPronto.m.id, masPronto.turno)}>
                  <span className="ic lleno"><Icono nombre="rayo" tam={22} /></span>
                  <span className="eleccion-txt">
                    <b>Quiero la cita más pronta</b>
                    <small>Con {nombreMedico(masPronto.m)}, que tiene el primer turno libre.</small>
                  </span>
                  <span className="eleccion-meta"><small>Primer turno</small><b>{cuando(masPronto.turno)}</b></span>
                  <Icono nombre="flecha" tam={18} />
                </button>
              )}
              {masPronto && <div className="separador">o elige tú el profesional</div>}
              <div className="elecciones">
                {profesionales.map(({ m, turno }) => {
                  const atiende = diasDeAtencion(m.horario)
                  return (
                    <button key={m.id} className="eleccion" aria-pressed={medicoId === m.id} disabled={!turno}
                            onClick={() => elegirProfesional(m.id)}>
                      <span className="avatar">{iniciales(m.nombre)}</span>
                      <span className="eleccion-txt">
                        <b>{nombreMedico(m)}</b>
                        <small>Consultas de {m.horario.duracion} minutos{m.registro ? ' · ' + m.registro : ''}</small>
                        <span className="dias-atiende" role="img"
                              aria-label={'Atiende ' + atiende.map((d) => DOW[d]).join(', ')}>
                          {[1, 2, 3, 4, 5, 6].map((d) => (
                            <i key={d} data-si={atiende.includes(d)}>{DOW[d].slice(0, 2)}</i>
                          ))}
                        </span>
                      </span>
                      <span className="eleccion-meta">
                        {turno ? <><small>Próximo turno</small><b>{cuando(turno)}</b></> : <small>Sin turnos en 3 semanas</small>}
                      </span>
                      <Icono nombre="flecha" tam={18} />
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {paso === 3 && (
            <section className="seccion">
              <div className="titulo-paso">
                <h2>¿Qué día y a qué hora?</h2>
                <p className="ayuda">Con {nombreMedico(medico)} · {especialidad.nombre}</p>
              </div>
              <div className="card dia-hora">
                <div className="seccion">
                  <div className="entre">
                    <h3>Elige el día</h3>
                    <span className="contador">{meses}</span>
                  </div>
                  <div className="cal" role="group" aria-label="Días para la cita">
                    {['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'].map((d) => <span key={d} className="cal-dow">{d}</span>)}
                    {calendario.map(({ f, fuera, turnos, libres }) => {
                      const d = desdeIso(f)
                      return (
                        <button key={f} className="cal-dia" aria-pressed={diaElegido === f} disabled={!libres}
                                data-hoy={f === iso(HOY)} data-fuera={fuera}
                                aria-label={fechaLarga(f) + (libres ? ', ' + (libres === 1 ? '1 hora libre' : libres + ' horas libres') : turnos ? ', sin horas libres' : ', no hay atención')}
                                onClick={() => { setFecha(f); setHora(null) }}>
                          <span className="num">{d.getDate()}</span>
                          <small>{libres ? libres + (libres === 1 ? ' libre' : ' libres') : turnos ? 'lleno' : f === iso(HOY) ? 'hoy' : ''}</small>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="seccion">
                  <div className="entre">
                    <h3>Elige la hora</h3>
                    <span className="contador">{Mayus(fechaLarga(diaElegido))}</span>
                  </div>
                  {libresDelDia ? grupos.map((g) => (
                    <div className="grupo-horas" key={g.txt}>
                      <span className="grupo-horas-nombre"><Icono nombre={g.icono} tam={17} /> {g.txt}</span>
                      <div className="horas">
                        {g.horas.map((h) => (
                          <button key={h.hora} className="hora" aria-pressed={hora === h.hora} disabled={!h.libre}
                                  title={h.libre ? undefined : 'Hora ocupada'} onClick={() => setHora(h.hora)}>
                            {hora12(h.hora)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )) : (
                    <div className="vacio">
                      <Icono nombre="reloj" tam={28} /><b>Ese día no quedan horas libres</b>
                      <p className="pequeno">Elige otro día en el calendario.</p>
                    </div>
                  )}
                  {libresDelDia > 0 && <p className="ayuda">Las horas tachadas ya están ocupadas.</p>}
                </div>
              </div>

              <div className="card stack" style={{ gap: '.7rem' }}>
                <label className="campo" htmlFor="motivo">Cuéntanos qué te pasa</label>
                <div className="fila" style={{ gap: '.4rem' }}>
                  {MOTIVOS.map((t) => (
                    <button key={t} type="button" className="filtro" onClick={() => agregarMotivo(t)}>
                      <Icono nombre="mas" tam={14} /> {t}
                    </button>
                  ))}
                </div>
                <textarea id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)}
                          placeholder="Ej: Tengo dolor de cabeza hace cinco días y me mareo al levantarme." />
                <span className="ayuda">Escríbelo con tus palabras. Esto le sirve al médico antes de la llamada.</span>
              </div>
            </section>
          )}

          {paso === 4 && (
            <section className="seccion">
              <div className="titulo-paso">
                <h2>Revisa antes de confirmar</h2>
                <p className="ayuda">Si algo no está bien, toca «Volver» y cámbialo.</p>
              </div>
              <div className="card stack">
                <div className="cita-fecha">
                  <div className="caja-fecha">
                    <div className="dia num">{desdeIso(diaElegido).getDate()}</div>
                    <div className="mes">{MESES[desdeIso(diaElegido).getMonth()].slice(0, 3)}</div>
                  </div>
                  <div className="stack" style={{ gap: '.15rem', minWidth: 0 }}>
                    <b style={{ fontSize: '1.15rem' }}>{Mayus(fechaLarga(diaElegido))}, {hora12(hora)}</b>
                    <span className="tenue">{especialidad.nombre} con {nombreMedico(medico)}</span>
                  </div>
                </div>
                <div className="datos-tabla" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
                  <Dato k="Paciente" v={paciente.nombre} />
                  <Dato k="Documento" v={paciente.doc} />
                  <Dato k="Modo" v="Videollamada" />
                  <Dato k="Duración" v={medico.horario.duracion + ' minutos'} />
                </div>
                <div className="nota">
                  <b>Motivo de la consulta</b>
                  <p>{motivo.trim() || 'Sin motivo escrito.'}</p>
                </div>
                <div className="item recordatorio">
                  <span className="ic azul"><Icono nombre="antena" tam={20} /></span>
                  <div className="cuerpo">
                    <b>El día de la cita</b>
                    <span className="meta">Entra a la plataforma 10 minutos antes y toca el botón verde de videollamada. Si se te cae el internet, vuelve a entrar y toca el mismo botón.</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          <div className="entre">
            {paso > primerPaso || reprograma
              ? <button className="btn fantasma" onClick={volver}><Icono nombre="atras" tam={20} /> Volver</button>
              : <span />}
            {paso < 4
              ? <button className="btn" disabled={!puedeSeguir} onClick={() => setPaso(paso + 1)}>Continuar <Icono nombre="flecha" tam={18} /></button>
              : <button className="btn" onClick={confirmar}>
                  <Icono nombre="check" tam={20} /> {reprograma ? 'Guardar el cambio' : 'Confirmar la cita'}
                </button>}
          </div>
        </div>

        {paso < 4 && (
          <aside className="resumen-cita" aria-label="Resumen de la cita">
            <h2>Tu cita</h2>
            {esAuxiliar && <Linea icono="usuario" k="Paciente" v={paciente.nombre} />}
            <Linea icono="pulso" k="Especialidad" v={especialidad?.nombre} />
            <Linea icono="estetoscopio" k="Profesional" v={medico && nombreMedico(medico)} />
            <Linea icono="calendario" k="Día" v={paso >= 3 && Mayus(fechaLarga(diaElegido))} />
            <Linea icono="reloj" k="Hora" v={paso >= 3 && hora && hora12(hora)} />
            <Linea icono="video" k="Modo" v="Videollamada" />
          </aside>
        )}
      </div>
    </div>
  )
}

const Dato = ({ k, v }) => (
  <div className="dato"><span className="k">{k}</span><span className="v">{v}</span></div>
)

/* Renglón del resumen: lo que falta por elegir se ve en gris. */
const Linea = ({ icono, k, v }) => (
  <div className="resumen-linea" data-listo={!!v}>
    <span className="ic"><Icono nombre={icono} tam={18} /></span>
    <div className="dato"><span className="k">{k}</span><span className="v">{v || 'Por elegir'}</span></div>
  </div>
)
