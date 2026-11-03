import React, { useState } from 'react'
import { useSearchParams, useParams } from 'react-router-dom'
import Icono from '../../componentes/Icono'
import ItemHistoria from '../../componentes/ItemHistoria'
import { useApp } from '../../contexto/AppContext'
import { historiaDePaciente, tramitesDePaciente, formulasDePaciente, buscarUsuario } from '../../servicios/api'
import { fechaLarga, iniciales, desdeIso, HOY } from '../../datos/utiles'

const TABS = [['datos', 'Mis datos'], ['historia', 'Historia clínica'], ['resultados', 'Resultados'], ['tramites', 'Trámites'], ['formulas', 'Fórmulas']]

/**
 * Perfil del paciente. El propio paciente lo ve de sí mismo;
 * el médico y el auxiliar lo abren con /pacientes/:id
 */
export default function Perfil() {
  const { db, sesion, setModal, acciones } = useApp()
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const paciente = id ? buscarUsuario(db, id) : sesion
  const tab = params.get('tab') || (id ? 'historia' : 'datos')

  const edad = paciente.nac ? Math.floor((HOY - desdeIso(paciente.nac)) / (365.25 * 86400000)) : null

  const editarDatos = () => setModal({
    titulo: 'Corregir mis datos',
    contenido: (cerrar) => (
      <form className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' }}
            onSubmit={(e) => {
              e.preventDefault()
              const f = Object.fromEntries(new FormData(e.target).entries())
              acciones.actualizarUsuario(paciente.id, f)
              cerrar()
            }}>
        <label className="campo">Teléfono<input name="tel" defaultValue={paciente.tel} /></label>
        <label className="campo">Municipio<input name="municipio" defaultValue={paciente.municipio} /></label>
        <label className="campo">Vereda<input name="vereda" defaultValue={paciente.vereda || ''} /></label>
        <label className="campo">EPS<input name="eps" defaultValue={paciente.eps || ''} /></label>
        <div className="fila" style={{ gridColumn: '1/-1', justifyContent: 'flex-end' }}>
          <button type="button" className="btn fantasma" onClick={cerrar}>Cancelar</button>
          <button className="btn" type="submit">Guardar</button>
        </div>
      </form>
    )
  })

  return (
    <div className="vista">
      <div className="titulo-vista">
        <h1>{id ? paciente.nombre : 'Mi perfil'}</h1>
        <span className="tenue">{id ? 'Documento ' + paciente.doc + ' · ' + (paciente.municipio || '') : 'Todo lo tuyo en un solo lugar: datos, consultas, resultados y trámites.'}</span>
      </div>

      <div className="tabs-perfil">
        {TABS.map(([k, t]) => (
          <button key={k} aria-current={tab === k ? 'page' : undefined} onClick={() => setParams({ tab: k })}>{t}</button>
        ))}
      </div>

      {tab === 'datos' && (
        <div className="stack">
          <div className="entre">
            <div className="cabecera-perfil">
              <div className="avatar">{iniciales(paciente.nombre)}</div>
              <div>
                <h2>{paciente.nombre}</h2>
                <span className="tenue">Documento {paciente.doc}{edad ? ' · ' + edad + ' años' : ''}</span>
              </div>
            </div>
            <button className="btn secundario pequeno" onClick={editarDatos}>
              <Icono nombre="editar" tam={18} /> Corregir mis datos
            </button>
          </div>
          <div className="datos-tabla">
            <Dato k="Teléfono" v={paciente.tel} />
            <Dato k="Municipio" v={paciente.municipio} />
            <Dato k="Vereda" v={paciente.vereda || '—'} />
            <Dato k="EPS" v={paciente.eps || '—'} />
            <Dato k="Puesto de salud" v={paciente.puesto || '—'} />
            <Dato k="Fecha de nacimiento" v={paciente.nac ? fechaLarga(paciente.nac) + ' de ' + paciente.nac.slice(0, 4) : '—'} />
          </div>
        </div>
      )}

      {tab === 'historia' && <Lista items={historiaDePaciente(db, paciente.id)} vacio="Tu historia clínica está vacía"
        render={(h) => <ItemHistoria key={h.id} h={h} />} />}

      {tab === 'resultados' && <Lista items={historiaDePaciente(db, paciente.id).filter((h) => h.tipo !== 'consulta')}
        vacio="Aún no hay resultados cargados" render={(h) => <ItemHistoria key={h.id} h={h} />} />}

      {tab === 'tramites' && <Lista items={tramitesDePaciente(db, paciente.id)} vacio="No tienes trámites pendientes"
        render={(t) => (
          <div className="item" key={t.id}>
            <span className={'ic ' + (t.estado === 'pendiente' ? 'ambar' : 'verde')}>
              <Icono nombre={t.estado === 'pendiente' ? 'alerta' : 'check'} tam={20} />
            </span>
            <div className="cuerpo">
              <div className="entre" style={{ gap: '.4rem' }}>
                <b>{t.titulo}</b>
                {t.estado === 'pendiente' ? <span className="pill aviso">Te falta</span> : <span className="pill ok">Listo</span>}
              </div>
              <span className="meta">{t.detalle}</span>
              <span className="tenue pequeno">Ordenado el {fechaLarga(t.fecha)}</span>
            </div>
          </div>
        )} />}

      {tab === 'formulas' && <Lista items={formulasDePaciente(db, paciente.id)} vacio="No tienes fórmulas registradas"
        render={(f) => (
          <div className="item" key={f.id}>
            <span className="ic verde"><Icono nombre="receta" tam={20} /></span>
            <div className="cuerpo">
              <b>Fórmula del {fechaLarga(f.fecha)}</b>
              <span className="meta">{f.autor}</span>
              <ul style={{ margin: '.3rem 0 0', paddingLeft: '1.1rem' }}>
                {f.items.map((i, n) => <li className="pequeno" key={n}>{i}</li>)}
              </ul>
            </div>
          </div>
        )} />}
    </div>
  )
}

const Dato = ({ k, v }) => <div className="dato"><span className="k">{k}</span><span className="v">{v}</span></div>

const Lista = ({ items, vacio, render }) =>
  items.length
    ? <div className="lista">{items.map(render)}</div>
    : <div className="vacio"><Icono nombre="archivo" tam={30} /><b>{vacio}</b></div>
