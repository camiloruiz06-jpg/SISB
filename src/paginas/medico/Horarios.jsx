import React, { useState } from 'react'
import Icono from '../../componentes/Icono'
import { useApp } from '../../contexto/AppContext'
import { turnosDeJornada } from '../../servicios/api'
import { DOW, hora12, deMinutos } from '../../datos/utiles'

/* Horas que se pueden elegir como inicio o fin de una jornada: de 6:00 a. m. a 8:00 p. m., cada 30 minutos. */
const OPCIONES = Array.from({ length: 29 }, (_, i) => deMinutos(360 + i * 30))
const DURACIONES = [15, 20, 30, 40]
const BLOQUES = { manana: { txt: 'Mañana', base: ['07:00', '12:00'] }, tarde: { txt: 'Tarde', base: ['14:00', '17:00'] } }

export default function Horarios() {
  const { sesion, acciones, aviso } = useApp()
  /* Se edita un borrador y se guarda con un solo botón, como en una agenda real. */
  const [borrador, setBorrador] = useState(() => structuredClone(sesion.horario))
  const cambiado = JSON.stringify(borrador) !== JSON.stringify(sesion.horario)

  const jornada = (d) => borrador.dias[d] || { manana: null, tarde: null }
  const actualizarDia = (d, cambios) =>
    setBorrador((b) => ({ ...b, dias: { ...b.dias, [d]: { ...jornada(d), ...cambios } } }))

  const alternarDia = (d) => {
    const j = jornada(d)
    const atiende = j.manana || j.tarde
    actualizarDia(d, atiende ? { manana: null, tarde: null } : { manana: [...BLOQUES.manana.base], tarde: null })
  }

  const guardar = () => {
    const malo = Object.entries(borrador.dias).find(([, j]) =>
      [j?.manana, j?.tarde].some((b) => b && b[0] >= b[1]))
    if (malo) return aviso('Revisa el ' + DOW[malo[0]] + ': la hora de inicio debe ser antes que la de fin.', 'error')
    acciones.guardarHorario(sesion.id, borrador)
  }

  const totalSemana = [1, 2, 3, 4, 5, 6].reduce((n, d) => n + turnosDeJornada(borrador, d).length, 0)

  return (
    <div className="vista">
      <div className="entre">
        <div className="titulo-vista">
          <h1>Mis horarios</h1>
          <span className="tenue">Define tu jornada de atención. Los pacientes solo podrán pedir citas en estos turnos.</span>
        </div>
      </div>

      <section className="seccion">
        <h2>Duración de cada consulta</h2>
        <div className="segmentado" style={{ gridTemplateColumns: 'repeat(4,1fr)', maxWidth: 440 }}>
          {DURACIONES.map((m) => (
            <label key={m}>
              <input type="radio" name="duracion" checked={borrador.duracion === m}
                     onChange={() => setBorrador((b) => ({ ...b, duracion: m }))} />
              {m} min
            </label>
          ))}
        </div>
      </section>

      <section className="seccion">
        <div className="entre">
          <h2>Jornada semanal</h2>
          <span className="contador">{totalSemana} turnos a la semana</span>
        </div>

        <div className="jornadas">
          {[1, 2, 3, 4, 5, 6].map((d) => {
            const j = jornada(d)
            const atiende = !!(j.manana || j.tarde)
            const n = turnosDeJornada(borrador, d).length
            return (
              <div className="jornada" key={d} data-activa={atiende}>
                <label className="jornada-dia">
                  <input type="checkbox" className="interruptor" checked={atiende} onChange={() => alternarDia(d)} />
                  <span>
                    <b>{DOW[d][0].toUpperCase() + DOW[d].slice(1)}</b>
                    <small>{atiende ? n + ' turnos' : 'No atiende'}</small>
                  </span>
                </label>

                {atiende && (
                  <div className="jornada-bloques">
                    {Object.entries(BLOQUES).map(([k, { txt, base }]) => (
                      <div className="bloque" key={k} data-activo={!!j[k]}>
                        <label className="bloque-nombre">
                          <input type="checkbox" checked={!!j[k]}
                                 onChange={() => actualizarDia(d, { [k]: j[k] ? null : [...base] })} />
                          {txt}
                        </label>
                        {j[k] ? (
                          <div className="rango">
                            <select aria-label={txt + ' desde'} value={j[k][0]}
                                    onChange={(e) => actualizarDia(d, { [k]: [e.target.value, j[k][1]] })}>
                              {OPCIONES.map((h) => <option key={h} value={h}>{hora12(h)}</option>)}
                            </select>
                            <span className="tenue">a</span>
                            <select aria-label={txt + ' hasta'} value={j[k][1]}
                                    onChange={(e) => actualizarDia(d, { [k]: [j[k][0], e.target.value] })}>
                              {OPCIONES.map((h) => <option key={h} value={h}>{hora12(h)}</option>)}
                            </select>
                          </div>
                        ) : <span className="tenue pequeno">Sin atención</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <p className="ayuda">Las citas que ya están agendadas no se borran al cambiar el horario.</p>
      </section>

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
