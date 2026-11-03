import React, { useState } from 'react'
import Icono from './Icono'
import { useApp } from '../contexto/AppContext'
import { buscarPacientes } from '../servicios/api'
import { iniciales } from '../datos/utiles'

const MAXIMO = 8

/**
 * Busca un paciente por cédula o por nombre y lo selecciona.
 * Con miles de pacientes no sirve una lista desplegable: aquí se escriben
 * los primeros números de la cédula y aparecen las coincidencias.
 * Uso:  <BuscadorPaciente alElegir={(p) => ...} alRegistrar={() => ...} />
 */
export default function BuscadorPaciente({ alElegir, alRegistrar, autoFoco = true }) {
  const { db } = useApp()
  const [texto, setTexto] = useState('')
  const q = texto.trim()
  const resultados = q.length >= 2 ? buscarPacientes(db, q) : []

  return (
    <div className="buscador-paciente">
      <label className="buscador">
        <span className="sr">Cédula o nombre del paciente</span>
        <Icono nombre="buscar" tam={19} />
        <input type="search" value={texto} autoFocus={autoFoco} inputMode="search"
               onChange={(e) => setTexto(e.target.value)}
               onKeyDown={(e) => { if (e.key === 'Enter' && resultados[0]) { e.preventDefault(); alElegir(resultados[0]) } }}
               placeholder="Escribe la cédula o el nombre" />
      </label>

      {q.length < 2 ? (
        <p className="ayuda">Escribe al menos 2 números de la cédula o 2 letras del nombre.</p>
      ) : resultados.length ? (
        <>
          <div className="lista resultados">
            {resultados.slice(0, MAXIMO).map((p) => (
              <button type="button" key={p.id} className="resultado" onClick={() => alElegir(p)}>
                <span className="avatar">{iniciales(p.nombre)}</span>
                <span className="resultado-txt">
                  <b>{p.nombre}</b>
                  <span>C.C. <Resaltar texto={p.doc} buscado={q} /> · {p.municipio}</span>
                </span>
                <Icono nombre="atras" tam={18} />
              </button>
            ))}
          </div>
          <p className="ayuda">
            {resultados.length > MAXIMO
              ? `${resultados.length.toLocaleString('es-CO')} coincidencias. Sigue escribiendo para encontrarlo más rápido.`
              : `${resultados.length} coincidencia${resultados.length === 1 ? '' : 's'}.`}
          </p>
        </>
      ) : (
        <div className="vacio">
          <Icono nombre="buscar" tam={28} />
          <b>No encontramos a nadie con "{q}"</b>
          {alRegistrar && (
            <button type="button" className="btn pequeno" onClick={alRegistrar}>
              <Icono nombre="agendar" tam={18} /> Registrar paciente nuevo
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* Marca en azul la parte de la cédula que coincide con lo escrito. */
const Resaltar = ({ texto, buscado }) => {
  const q = buscado.replace(/[\s.]/g, '')
  const i = /^[0-9]+$/.test(q) ? texto.indexOf(q) : -1
  if (i < 0) return texto
  return <>{texto.slice(0, i)}<mark>{texto.slice(i, i + q.length)}</mark>{texto.slice(i + q.length)}</>
}
