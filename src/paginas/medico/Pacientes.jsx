import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icono from '../../componentes/Icono'
import Paginacion from '../../componentes/Paginacion'
import { useApp } from '../../contexto/AppContext'
import { buscarUsuario, buscarPacientes, citasDeMedico, citasDePaciente, listarPacientes } from '../../servicios/api'
import { iniciales, desdeIso, HOY, fechaCorta } from '../../datos/utiles'

const POR_PAGINA = 20

/** Lista de pacientes. La usan el médico (los suyos) y el auxiliar (los de su puesto o todos). */
export default function Pacientes() {
  const { db, sesion } = useApp()
  const navegar = useNavigate()
  const esMedico = sesion.rol === 'medico'
  const base = esMedico ? '/medico/pacientes/' : '/auxiliar/pacientes/'

  const [texto, setTexto] = useState('')
  const [alcance, setAlcance] = useState('mios')
  const [pagina, setPagina] = useState(1)

  /* Universo de pacientes según el rol y el filtro elegido. */
  const universo = useMemo(() => {
    if (alcance === 'todos') return listarPacientes(db)
    if (esMedico) {
      const ids = new Set(citasDeMedico(db, sesion.id).map((c) => c.pacienteId))
      return [...ids].map((id) => buscarUsuario(db, id)).filter(Boolean)
    }
    return listarPacientes(db).filter((p) => p.puesto === sesion.puesto)
  }, [db, alcance, esMedico, sesion])

  const resultados = useMemo(() => {
    const r = buscarPacientes(db, texto, universo)
    return texto.trim() ? r : [...r].sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [db, texto, universo])
  const visibles = resultados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  const edad = (p) => (p.nac ? Math.floor((HOY - desdeIso(p.nac)) / (365.25 * 86400000)) : null)
  const ultimaCita = (p) => citasDePaciente(db, p.id).filter((c) => c.estado === 'atendida')
    .reduce((u, c) => (!u || c.fecha > u ? c.fecha : u), null)

  const cambiar = (fn) => (v) => { fn(v); setPagina(1) }

  return (
    <div className="vista">
      <div className="titulo-vista">
        <h1>Pacientes</h1>
        <span className="tenue">
          {esMedico ? 'Busca por cédula o nombre. Puedes ver tus pacientes o toda la red.' : 'Busca por cédula o nombre a cualquier paciente de la red.'}
        </span>
      </div>

      <div className="stack" style={{ gap: '.7rem' }}>
        <label className="buscador">
          <span className="sr">Buscar paciente</span>
          <Icono nombre="buscar" tam={19} />
          <input type="search" value={texto} onChange={(e) => cambiar(setTexto)(e.target.value)}
                 placeholder="Cédula, nombre, vereda o corregimiento" autoFocus />
        </label>
        <div className="filtros" role="group" aria-label="Qué pacientes ver">
          <button className="filtro" aria-pressed={alcance === 'mios'} onClick={() => cambiar(setAlcance)('mios')}>
            {esMedico ? 'Mis pacientes' : 'Mi puesto de salud'}
          </button>
          <button className="filtro" aria-pressed={alcance === 'todos'} onClick={() => cambiar(setAlcance)('todos')}>
            Toda la red <span className="cuenta num">{listarPacientes(db).length.toLocaleString('es-CO')}</span>
          </button>
        </div>
      </div>

      {visibles.length ? (
        <>
          <div className="tabla-env adaptable">
            <table>
              <thead>
                <tr><th>Paciente</th><th>Cédula</th><th>Edad</th><th>EPS</th><th>Última consulta</th><th style={{ width: 1 }}></th></tr>
              </thead>
              <tbody>
                {visibles.map((p) => {
                  const u = ultimaCita(p)
                  return (
                    <tr key={p.id}>
                      <td className="completa">
                        <div className="persona">
                          <span className="avatar">{iniciales(p.nombre)}</span>
                          <div style={{ minWidth: 0 }}>
                            <b>{p.nombre}</b>
                            <div className="tenue pequeno">{p.vereda || p.municipio}</div>
                          </div>
                        </div>
                      </td>
                      <td className="num" data-k="Cédula">{p.doc}</td>
                      <td className="num" data-k="Edad">{edad(p) !== null ? edad(p) + ' años' : '—'}</td>
                      <td data-k="EPS">{p.eps || '—'}</td>
                      <td data-k="Última consulta">{u ? fechaCorta(u) : 'Sin consultas'}</td>
                      <td className="acciones">
                        <div className="fila" style={{ gap: '.4rem', flexWrap: 'nowrap' }}>
                          <button className="btn pequeno secundario" onClick={() => navegar(base + p.id)}>
                            <Icono nombre="archivo" tam={18} /> Historia
                          </button>
                          {!esMedico && (
                            <button className="iconbtn chico" title="Subir documento" aria-label={'Subir documento de ' + p.nombre}
                                    onClick={() => navegar('/auxiliar/subir')}>
                              <Icono nombre="subir" tam={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Paginacion total={resultados.length} pagina={pagina} porPagina={POR_PAGINA} alCambiar={setPagina} />
        </>
      ) : (
        <div className="vacio">
          <Icono nombre="buscar" tam={30} />
          <b>{texto.trim() ? 'Nadie coincide con "' + texto.trim() + '"' : 'Todavía no hay pacientes'}</b>
          {alcance === 'mios' && texto.trim() && (
            <button className="btn pequeno fantasma" onClick={() => cambiar(setAlcance)('todos')}>Buscar en toda la red</button>
          )}
        </div>
      )}
    </div>
  )
}
