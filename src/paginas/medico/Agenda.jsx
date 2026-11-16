import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icono from '../../componentes/Icono'
import { useApp } from '../../contexto/AppContext'
import { FOTOS } from '../../datos/imagenes'
import { buscarUsuario, buscarEspecialidad, citasDelDia, citasDeMedico, nombreMedico } from '../../servicios/api'
import { HOY, iso, fechaLarga, hora12, sumaDias, desdeIso, saludo, DOW, MESES } from '../../datos/utiles'

const ESTADOS = {
  programada: <span className="pill info">Programada</span>,
  atendida: <span className="pill ok">Atendida</span>,
  'no-asistio': <span className="pill aviso">No asistió</span>,
  cancelada: <span className="pill alerta">Cancelada</span>
}

/* Lunes de la semana de una fecha. */
const lunesDe = (d) => sumaDias(d, -((d.getDay() + 6) % 7))

/** Agenda del médico por semana y por día (R.5-1). */
export default function Agenda() {
  const { db, sesion, acciones, aviso } = useApp()
  const navegar = useNavigate()
  const [dia, setDia] = useState(iso(HOY))
  const lunes = lunesDe(desdeIso(dia))
  const semana = Array.from({ length: 6 }, (_, i) => iso(sumaDias(lunes, i)))

  const delDia = citasDelDia(db, sesion.id, dia)
  const activas = delDia.filter((c) => c.estado !== 'cancelada')
  const pendientes = delDia.filter((c) => c.estado === 'programada').length
  const deHoy = citasDelDia(db, sesion.id, iso(HOY)).filter((c) => c.estado !== 'cancelada')
  const porAtenderHoy = deHoy.filter((c) => c.estado === 'programada').length
  const enSemana = semana.reduce((n, f) => n + citasDelDia(db, sesion.id, f).filter((c) => c.estado !== 'cancelada').length, 0)
  const atendidas = citasDeMedico(db, sesion.id).filter((c) => c.estado === 'atendida').length

  const marcarNoAsistio = (id) => { acciones.cambiarEstadoCita(id, 'no-asistio'); aviso('Cita marcada como no asistida.') }
  const moverSemana = (n) => setDia(iso(sumaDias(lunes, n * 7)))

  return (
    <div className="vista">
      <div className="banner-foto" style={{ '--foto': `url(${FOTOS.consulta})` }}>
        <span className="tenue">{fechaLarga(iso(HOY))}</span>
        <h1>{saludo()}, {nombreMedico(sesion)}</h1>
        <span className="tenue">
          {buscarEspecialidad(db, sesion.espId).nombre} · {porAtenderHoy
            ? 'hoy te ' + (porAtenderHoy === 1 ? 'queda 1 cita' : 'quedan ' + porAtenderHoy + ' citas') + ' por atender'
            : 'hoy no tienes citas pendientes'}
        </span>
      </div>

      <div className="kpis">
        <Indicador icono="reloj" k="Citas hoy" v={deHoy.length} />
        <Indicador icono="calendario" k="Esta semana" v={enSemana} />
        <Indicador icono="check" k="Atendidas en total" v={atendidas.toLocaleString('es-CO')} />
      </div>

      <section className="seccion">
        <div className="entre">
          <h2>Semana del {desdeIso(semana[0]).getDate()} de {MESES[desdeIso(semana[0]).getMonth()]}</h2>
          {dia !== iso(HOY) && <button className="btn pequeno fantasma" onClick={() => setDia(iso(HOY))}>Volver a hoy</button>}
        </div>
        <div className="semana">
          <button className="iconbtn chico" onClick={() => moverSemana(-1)} aria-label="Semana anterior"><Icono nombre="atras" tam={18} /></button>
          {semana.map((f) => {
            const d = desdeIso(f)
            const n = citasDelDia(db, sesion.id, f).filter((c) => c.estado !== 'cancelada').length
            return (
              <button key={f} className="dia-semana" aria-pressed={dia === f} data-hoy={f === iso(HOY)} onClick={() => setDia(f)}>
                <span className="dow">{DOW[d.getDay()].slice(0, 3)}</span>
                <span className="dd num">{d.getDate()}</span>
                <span className="cuantas">{n ? n + ' cita' + (n === 1 ? '' : 's') : '—'}</span>
              </button>
            )
          })}
          <button className="iconbtn chico girar" onClick={() => moverSemana(1)} aria-label="Semana siguiente"><Icono nombre="atras" tam={18} /></button>
        </div>
      </section>

      <section className="seccion">
        <div className="entre">
          <h2>{fechaLarga(dia).charAt(0).toUpperCase() + fechaLarga(dia).slice(1)}</h2>
          {activas.length > 0 && <span className="contador">{activas.length} citas · {pendientes} por atender</span>}
        </div>
        {delDia.length ? (
          <div className="lista">
            {delDia.map((c) => {
              const p = buscarUsuario(db, c.pacienteId)
              const [hh, ...ampm] = hora12(c.hora).split(' ')
              return (
                <div className="fila-cita" key={c.id} data-estado={c.estado}>
                  <span className="hora-caja">{hh}<small>{ampm.join(' ')}</small></span>
                  <div className="quien">
                    <b>{p.nombre}</b>
                    <span>C.C. {p.doc} · {p.municipio}</span>
                    <span>{c.motivo}</span>
                  </div>
                  <div className="fila acciones-cita" style={{ gap: '.4rem', justifyContent: 'flex-end' }}>
                    {ESTADOS[c.estado]}
                    {c.estado === 'programada' && dia === iso(HOY) && (
                      <>
                        <button className="btn pequeno" onClick={() => navegar('/llamada/' + c.id)}>
                          <Icono nombre="video" tam={18} /> Atender
                        </button>
                        <button className="btn pequeno fantasma" onClick={() => marcarNoAsistio(c.id)}>No asistió</button>
                      </>
                    )}
                    {c.estado === 'atendida' && (
                      <button className="btn pequeno fantasma" onClick={() => navegar('/llamada/' + c.id)}>Ver registro</button>
                    )}
                    <button className="iconbtn chico" title="Historia clínica" aria-label={'Historia clínica de ' + p.nombre}
                            onClick={() => navegar('/medico/pacientes/' + p.id)}>
                      <Icono nombre="archivo" tam={18} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="vacio"><Icono nombre="reloj" tam={30} /><b>No hay citas este día</b></div>
        )}
      </section>
    </div>
  )
}

const Indicador = ({ icono, k, v }) => (
  <div className="kpi">
    <span className="kpi-k"><Icono nombre={icono} tam={16} /> {k}</span>
    <span className="kpi-v">{v}</span>
  </div>
)
