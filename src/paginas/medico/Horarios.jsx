import React, { useState } from 'react'
import Icono from '../../componentes/Icono'
import { useApp } from '../../contexto/AppContext'
import { turnosDeJornada } from '../../servicios/api'
import { DOW, hora12, aMinutos, deMinutos } from '../../datos/utiles'

const DIAS = [1, 2, 3, 4, 5, 6]            // lunes a sábado
const DURACIONES = [15, 20, 30, 40]
/* Cada día puede tener una franja de mañana y otra de tarde. "desde" y "hasta" son los
   límites (en minutos) entre los que se puede mover cada una, para que no se crucen. */
const FRANJAS = {
  manana: { txt: 'Mañana', icono: 'sol', base: ['07:00', '12:00'], desde: 6 * 60, hasta: 13 * 60 },
  tarde: { txt: 'Tarde', icono: 'tarde', base: ['14:00', '17:00'], desde: 12 * 60, hasta: 20 * 60 }
}
const VISTA_INI = 6 * 60, VISTA_FIN = 20 * 60   // la vista de la semana va de 6:00 a. m. a 8:00 p. m.

const Mayus = (t) => t[0].toUpperCase() + t.slice(1)
const franjasDe = (j) => [j?.manana, j?.tarde].filter(Boolean)
const minutosDe = (j) => franjasDe(j).reduce((n, [ini, fin]) => n + aMinutos(fin) - aMinutos(ini), 0)
const enHoras = (min) => (min / 60).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' h'
/* '14:00' -> '2:00' (en la vista de la semana el a. m. / p. m. lo da el eje). */
const horaCorta = (h) => hora12(h).split(' ')[0]

export default function Horarios() {
  const { sesion, acciones, aviso } = useApp()
  /* Se edita un borrador y se guarda con un solo botón, como en una agenda real. */
  const [borrador, setBorrador] = useState(() => structuredClone(sesion.horario))
  const cambiado = JSON.stringify(borrador) !== JSON.stringify(sesion.horario)

  const jornada = (d) => borrador.dias[d] || { manana: null, tarde: null }
  const actualizarDia = (d, cambios) =>
    setBorrador((b) => ({ ...b, dias: { ...b.dias, [d]: { ...jornada(d), ...cambios } } }))

  const alternarDia = (d) => {
    const atiende = franjasDe(jornada(d)).length > 0
    actualizarDia(d, atiende ? { manana: null, tarde: null } : { manana: [...FRANJAS.manana.base], tarde: null })
  }

  /* Al mover el inicio más allá del fin, el fin se corre una hora para que la franja siga siendo válida. */
  const cambiarInicio = (d, k, ini) => {
    const [, fin] = jornada(d)[k]
    const nuevoFin = aMinutos(fin) > aMinutos(ini) ? fin : deMinutos(Math.min(aMinutos(ini) + 60, FRANJAS[k].hasta))
    actualizarDia(d, { [k]: [ini, nuevoFin] })
  }

  const repetirEntreSemana = (d) => {
    const j = jornada(d)
    setBorrador((b) => ({
      ...b,
      dias: { ...b.dias, ...Object.fromEntries([1, 2, 3, 4, 5].map((x) => [x, structuredClone(j)])) }
    }))
    aviso('Se copió el horario del ' + DOW[d] + ' de lunes a viernes. Revisa y guarda.')
  }

  const guardar = () => {
    const cruzado = DIAS.find((d) => {
      const j = jornada(d)
      return j.manana && j.tarde && aMinutos(j.tarde[0]) < aMinutos(j.manana[1])
    })
    if (cruzado) return aviso('Revisa el ' + DOW[cruzado] + ': la tarde debe empezar cuando ya terminó la mañana.', 'error')
    acciones.guardarHorario(sesion.id, borrador)
  }

  const diasActivos = DIAS.filter((d) => franjasDe(jornada(d)).length)
  const minutosSemana = DIAS.reduce((n, d) => n + minutosDe(jornada(d)), 0)
  const porHora = 60 / borrador.duracion
  const turnosSemana = DIAS.reduce((n, d) => n + turnosDeJornada(borrador, d).length, 0)

  return (
    <div className="vista">
      <div className="titulo-vista">
        <h1>Mis horarios</h1>
        <span className="tenue">Define cuándo atiendes. Los pacientes solo pueden pedir cita en estos turnos.</span>
      </div>

      <div className="kpis">
        <div className="kpi">
          <span className="kpi-k"><Icono nombre="calendario" tam={16} /> Días de atención</span>
          <span className="kpi-v">{diasActivos.length}</span>
          <span className="kpi-extra">{diasActivos.map((d) => DOW[d].slice(0, 3)).join(', ') || 'Ninguno'}</span>
        </div>
        <div className="kpi">
          <span className="kpi-k"><Icono nombre="reloj" tam={16} /> Horas a la semana</span>
          <span className="kpi-v">{enHoras(minutosSemana)}</span>
          <span className="kpi-extra">de atención por videollamada</span>
        </div>
        <div className="kpi">
          <span className="kpi-k"><Icono nombre="usuarios" tam={16} /> Turnos a la semana</span>
          <span className="kpi-v">{turnosSemana}</span>
          <span className="kpi-extra">consultas de {borrador.duracion} min</span>
        </div>
      </div>

      <div className="horario-cuerpo">
        <div className="stack" style={{ gap: '1.6rem', minWidth: 0 }}>
          <section className="seccion">
            <h2>¿Cuánto dura cada consulta?</h2>
            <div className="segmentado" style={{ gridTemplateColumns: 'repeat(4,1fr)', maxWidth: 440 }}>
              {DURACIONES.map((m) => (
                <label key={m}>
                  <input type="radio" name="duracion" checked={borrador.duracion === m}
                         onChange={() => setBorrador((b) => ({ ...b, duracion: m }))} />
                  {m} min
                </label>
              ))}
            </div>
            <p className="ayuda">Con {borrador.duracion} minutos atiendes {Number.isInteger(porHora) ? porHora + ' pacientes por hora' : '3 pacientes cada 2 horas'}.</p>
          </section>

          <section className="seccion">
            <h2>¿Qué días y a qué horas atiendes?</h2>
            <div className="dias-horario">
              {DIAS.map((d) => {
                const j = jornada(d)
                const atiende = franjasDe(j).length > 0
                const n = turnosDeJornada(borrador, d).length
                return (
                  <div className="dia-horario" key={d} data-activo={atiende}>
                    <div className="dia-horario-cabeza">
                      <label className="dia-horario-nombre">
                        <input type="checkbox" className="interruptor" checked={atiende} onChange={() => alternarDia(d)} />
                        <span>
                          <b>{Mayus(DOW[d])}</b>
                          <small>{atiende ? n + ' turnos · ' + enHoras(minutosDe(j)) : 'No atiendes'}</small>
                        </span>
                      </label>
                      {atiende && d <= 5 && (
                        <button className="enlace con-icono" onClick={() => repetirEntreSemana(d)}>
                          <Icono nombre="copiar" tam={15} /> Repetir de lunes a viernes
                        </button>
                      )}
                    </div>

                    {atiende && (
                      <div className="franjas">
                        {Object.entries(FRANJAS).map(([k, f]) => j[k] ? (
                          <div className="franja" key={k}>
                            <span className="franja-nombre"><Icono nombre={f.icono} tam={17} /> {f.txt}</span>
                            <SelectorHora etiqueta={f.txt + ' del ' + DOW[d] + ', desde'} valor={j[k][0]}
                                          desde={f.desde} hasta={f.hasta - 30}
                                          alCambiar={(h) => cambiarInicio(d, k, h)} />
                            <span className="tenue">a</span>
                            <SelectorHora etiqueta={f.txt + ' del ' + DOW[d] + ', hasta'} valor={j[k][1]}
                                          desde={aMinutos(j[k][0]) + 30} hasta={f.hasta}
                                          alCambiar={(h) => actualizarDia(d, { [k]: [j[k][0], h] })} />
                            <button className="iconbtn chico" title={'Quitar la ' + f.txt.toLowerCase()}
                                    aria-label={'Quitar la ' + f.txt.toLowerCase() + ' del ' + DOW[d]}
                                    onClick={() => actualizarDia(d, { [k]: null })}>
                              <Icono nombre="equis" tam={16} />
                            </button>
                          </div>
                        ) : (
                          <button className="agregar-franja" key={k} onClick={() => actualizarDia(d, { [k]: [...f.base] })}>
                            <Icono nombre="mas" tam={16} /> Agregar {f.txt.toLowerCase()}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="ayuda">Las citas que ya están agendadas no se borran al cambiar el horario.</p>
          </section>
        </div>

        <aside className="semana-vista" aria-label="Vista de tu semana">
          <h2>Así queda tu semana</h2>
          <div className="sv">
            <div className="sv-eje" aria-hidden="true">
              {[6, 8, 10, 12, 14, 16, 18, 20].map((h) => (
                <span key={h} style={{ top: ((h * 60 - VISTA_INI) / (VISTA_FIN - VISTA_INI)) * 100 + '%' }}>
                  {h === 12 ? '12 m.' : (h > 12 ? h - 12 : h) + (h < 12 ? ' a. m.' : ' p. m.')}
                </span>
              ))}
            </div>
            {DIAS.map((d) => (
              <div className="sv-dia" key={d} data-activo={franjasDe(jornada(d)).length > 0}>
                <b>{DOW[d].slice(0, 3)}</b>
                <div className="sv-carril">
                  {franjasDe(jornada(d)).map(([ini, fin], i) => (
                    <i key={i} title={Mayus(DOW[d]) + ': ' + hora12(ini) + ' a ' + hora12(fin)}
                       style={{
                         top: ((aMinutos(ini) - VISTA_INI) / (VISTA_FIN - VISTA_INI)) * 100 + '%',
                         height: ((aMinutos(fin) - aMinutos(ini)) / (VISTA_FIN - VISTA_INI)) * 100 + '%'
                       }}>
                      <span>{horaCorta(ini)}</span>
                      {aMinutos(fin) - aMinutos(ini) >= 150 && <span>{horaCorta(fin)}</span>}
                    </i>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="ayuda">En azul, las horas en que los pacientes pueden pedirte cita.</p>
        </aside>
      </div>

      <div className="barra-guardar" data-visible={cambiado}>
        <span className="pequeno"><Icono nombre="alerta" tam={16} /> Tienes cambios sin guardar</span>
        <div className="fila" style={{ gap: '.5rem' }}>
          <button className="btn pequeno fantasma" onClick={() => setBorrador(structuredClone(sesion.horario))}>Descartar</button>
          <button className="btn pequeno" onClick={guardar}><Icono nombre="check" tam={18} /> Guardar horario</button>
        </div>
      </div>
    </div>
  )
}

/** Lista de horas cada 30 minutos entre dos límites. Si el valor guardado quedó por fuera, igual se muestra. */
function SelectorHora({ etiqueta, valor, desde, hasta, alCambiar }) {
  const horas = []
  for (let t = desde; t <= hasta; t += 30) horas.push(deMinutos(t))
  if (!horas.includes(valor)) { horas.push(valor); horas.sort() }
  return (
    <select aria-label={etiqueta} value={valor} onChange={(e) => alCambiar(e.target.value)}>
      {horas.map((h) => <option key={h} value={h}>{hora12(h)}</option>)}
    </select>
  )
}
