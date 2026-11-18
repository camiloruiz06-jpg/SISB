import React, { useMemo, useState } from 'react'
import Icono from '../../componentes/Icono'
import { useApp } from '../../contexto/AppContext'
import { buscarEspecialidad, nombreMedico, buscarPacientes } from '../../servicios/api'
import Paginacion from '../../componentes/Paginacion'
import { iniciales } from '../../datos/utiles'
import { ROL_TXT } from '../../componentes/Shell'
import FormularioPaciente from '../FormularioPaciente'

const PILLS = {
  paciente: <span className="pill">Paciente</span>,
  medico: <span className="pill info">Médico</span>,
  auxiliar: <span className="pill ok">Auxiliar</span>,
  admin: <span className="pill aviso">Admin</span>
}

const FILTROS = [
  { v: 'todos', txt: 'Todos' },
  { v: 'paciente', txt: 'Pacientes' },
  { v: 'medico', txt: 'Médicos' },
  { v: 'auxiliar', txt: 'Auxiliares' },
  { v: 'admin', txt: 'Admin' }
]

const POR_PAGINA = 25

export default function Usuarios() {
  const { db, sesion, acciones, setModal, aviso } = useApp()
  const [filtro, setFiltro] = useState('todos')
  const [texto, setTexto] = useState('')
  const [pagina, setPagina] = useState(1)

  const nuevo = () => setModal({
    titulo: 'Nuevo usuario',
    contenido: (cerrar) => <FormularioPaciente conRol alTerminar={() => cerrar()} alCancelar={cerrar} />
  })

  const editar = (x) => setModal({
    titulo: 'Modificar usuario',
    contenido: (cerrar) => (
      <form className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' }}
            onSubmit={(e) => {
              e.preventDefault()
              const f = Object.fromEntries(new FormData(e.target).entries())
              if (acciones.actualizarUsuario(x.id, { nombre: f.nombre.trim(), doc: f.doc.trim(), tel: f.tel.trim(), rol: f.rol })) cerrar()
            }}>
        <label className="campo">Nombre<input name="nombre" defaultValue={x.nombre} required /></label>
        <label className="campo">Documento<input name="doc" defaultValue={x.doc} required /></label>
        <label className="campo">Teléfono<input name="tel" defaultValue={x.tel || ''} /></label>
        <label className="campo">Rol
          <select name="rol" defaultValue={x.rol}>
            {['paciente', 'medico', 'auxiliar', 'admin'].map((r) => <option key={r} value={r}>{ROL_TXT[r]}</option>)}
          </select>
        </label>
        <div className="fila" style={{ gridColumn: '1/-1', justifyContent: 'flex-end' }}>
          <button type="button" className="btn fantasma" onClick={cerrar}>Cancelar</button>
          <button className="btn" type="submit">Guardar cambios</button>
        </div>
      </form>
    )
  })

  const eliminar = (x) => {
    if (x.id === sesion.id) return aviso('No puedes eliminar tu propia cuenta mientras la usas.', 'error')
    setModal({
      titulo: '¿Eliminar este usuario?', peligro: true, confirmar: 'Sí, eliminar',
      cuerpo: <p>Se eliminará la cuenta de <b>{x.nombre}</b>. Esta acción no se puede deshacer.</p>,
      alConfirmar: () => acciones.eliminarUsuario(x.id)
    })
  }

  const detalle = (x) => x.vereda || x.puesto || x.municipio || x.cargo || (x.espId ? buscarEspecialidad(db, x.espId).nombre : '')
  /* Misma búsqueda que la de pacientes: por cédula (si son números) o por nombre y lugar. */
  const resultados = useMemo(() => buscarPacientes(db, texto, db.usuarios.filter((x) => filtro === 'todos' || x.rol === filtro)),
    [db, texto, filtro])
  const visibles = resultados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
  const cuentas = useMemo(() => db.usuarios.reduce((m, x) => ({ ...m, [x.rol]: (m[x.rol] || 0) + 1 }), {}), [db.usuarios])
  const cuenta = (v) => (v === 'todos' ? db.usuarios.length : cuentas[v] || 0).toLocaleString('es-CO')

  return (
    <div className="vista">
      <div className="entre">
        <div className="titulo-vista">
          <h1>Usuarios</h1>
          <span className="tenue">{db.usuarios.length.toLocaleString('es-CO')} cuentas en la plataforma. Consulta, modifica o elimina.</span>
        </div>
        <button className="btn" onClick={nuevo}><Icono nombre="agendar" tam={20} /> Nuevo usuario</button>
      </div>

      <div className="stack" style={{ gap: '.8rem' }}>
        <div className="herramientas">
          <label className="buscador">
            <span className="sr">Buscar usuario</span>
            <Icono nombre="buscar" tam={19} />
            <input type="search" value={texto} onChange={(e) => { setTexto(e.target.value); setPagina(1) }}
                   placeholder="Buscar por cédula, nombre o vereda" />
          </label>
        </div>
        <div className="filtros" role="group" aria-label="Filtrar por rol">
          {FILTROS.map((f) => (
            <button key={f.v} className="filtro" aria-pressed={filtro === f.v} onClick={() => { setFiltro(f.v); setPagina(1) }}>
              {f.txt} <span className="cuenta num">{cuenta(f.v)}</span>
            </button>
          ))}
        </div>
      </div>

      {visibles.length ? (
        <div className="tabla-env adaptable">
          <table>
            <thead>
              <tr><th>Nombre</th><th>Documento</th><th>Rol</th><th>Teléfono</th><th style={{ width: 1 }}>Acciones</th></tr>
            </thead>
            <tbody>
              {visibles.map((x) => (
                <tr key={x.id}>
                  <td className="completa">
                    <div className="persona">
                      <span className="avatar">{iniciales(x.nombre)}</span>
                      <div style={{ minWidth: 0 }}>
                        <b>{x.rol === 'medico' ? nombreMedico(x) : x.nombre}</b>
                        <div className="tenue pequeno">{detalle(x)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="num" data-k="Documento">{x.doc}</td>
                  <td data-k="Rol"><span>{PILLS[x.rol]}</span></td>
                  <td className="num" data-k="Teléfono">{x.tel || '—'}</td>
                  <td className="acciones">
                    <div className="fila" style={{ gap: '.4rem', flexWrap: 'nowrap' }}>
                      <button className="iconbtn chico" onClick={() => editar(x)}
                              title="Editar" aria-label={'Editar ' + x.nombre}>
                        <Icono nombre="editar" tam={18} />
                      </button>
                      <button className="iconbtn chico rojo" onClick={() => eliminar(x)}
                              title="Eliminar" aria-label={'Eliminar ' + x.nombre}>
                        <Icono nombre="borrar" tam={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {visibles.length ? (
        <Paginacion total={resultados.length} pagina={pagina} porPagina={POR_PAGINA} alCambiar={setPagina} />
      ) : (
        <div className="vacio">
          <Icono nombre="buscar" tam={30} />
          <b>No encontramos usuarios con esa búsqueda</b>
          <button className="btn pequeno fantasma" onClick={() => { setTexto(''); setFiltro('todos') }}>Ver todos</button>
        </div>
      )}
    </div>
  )
}
