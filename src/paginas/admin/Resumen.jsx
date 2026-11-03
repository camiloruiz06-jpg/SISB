import React from 'react'
import Icono from '../../componentes/Icono'
import { useApp } from '../../contexto/AppContext'
import { HOY, iso, fechaLarga } from '../../datos/utiles'

export default function Resumen() {
  const { db } = useApp()
  const porRol = (r) => db.usuarios.filter((x) => x.rol === r).length
  const porEstado = (e) => db.citas.filter((c) => c.estado === e).length
  const pacientes = db.usuarios.filter((x) => x.rol === 'paciente')
  const municipios = [...new Set(pacientes.map((x) => x.municipio))]
    .map((m) => ({ m, n: pacientes.filter((x) => x.municipio === m).length }))
    .sort((a, b) => b.n - a.n)
  const maximo = Math.max(1, ...municipios.map((x) => x.n))
  const top = municipios.slice(0, 10)
  const fmt = (n) => n.toLocaleString('es-CO')

  const totalCitas = db.citas.length || 1
  const estados = [
    { k: 'Programadas', n: porEstado('programada'), clase: 'info' },
    { k: 'Atendidas', n: porEstado('atendida'), clase: 'ok' },
    { k: 'Canceladas', n: porEstado('cancelada'), clase: 'alerta' }
  ]

  return (
    <div className="vista">
      <div className="titulo-vista">
        <h1>Resumen del sistema</h1>
        <span className="tenue">Estado general de SISB al {fechaLarga(iso(HOY))}.</span>
      </div>

      <div className="kpis">
        <Kpi icono="usuario" k="Pacientes" v={fmt(porRol('paciente'))} extra={municipios.length + ' municipios'} />
        <Kpi icono="pulso" k="Profesionales" v={porRol('medico')} extra={db.especialidades.length + ' especialidades'} />
        <Kpi icono="usuarios" k="Auxiliares" v={porRol('auxiliar')} extra="Apoyo en los puestos" />
        <Kpi icono="calendario" k="Citas programadas" v={fmt(porEstado('programada'))} />
        <Kpi icono="check" k="Citas atendidas" v={fmt(porEstado('atendida'))} />
        <Kpi icono="equis" k="Citas canceladas" v={fmt(porEstado('cancelada'))} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.6rem' }}>
        <section className="seccion">
          <div className="entre"><h2>Municipios con más pacientes</h2><span className="contador">{municipios.length} municipios en total</span></div>
          <div className="lista">
            {top.map(({ m, n }) => (
              <div className="item" key={m} style={{ alignItems: 'center' }}>
                <span className="ic azul"><Icono nombre="mapa" tam={19} /></span>
                <div className="cuerpo" style={{ gap: '.45rem' }}>
                  <div className="entre"><b>{m}</b><span className="tenue pequeno num">{fmt(n)} paciente{n === 1 ? '' : 's'}</span></div>
                  <div className="barra"><i style={{ width: (n / maximo) * 100 + '%' }} /></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="seccion">
          <h2>Estado de las citas</h2>
          <div className="lista">
            {estados.map((e) => (
              <div className="item" key={e.k} style={{ alignItems: 'center' }}>
                <div className="cuerpo" style={{ gap: '.45rem' }}>
                  <div className="entre"><span className={'pill ' + e.clase}>{e.k}</span><b className="num">{fmt(e.n)}</b></div>
                  <div className="barra"><i style={{ width: (e.n / totalCitas) * 100 + '%' }} /></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

const Kpi = ({ icono, k, v, extra }) => (
  <div className="kpi">
    <span className="kpi-k"><Icono nombre={icono} tam={16} /> {k}</span>
    <span className="kpi-v">{v}</span>
    {extra && <span className="kpi-extra">{extra}</span>}
  </div>
)
