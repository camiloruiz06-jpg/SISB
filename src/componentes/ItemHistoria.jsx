import React from 'react'
import Icono from './Icono'
import { fechaLarga } from '../datos/utiles'

const TIPOS = {
  consulta:  { t: 'Consulta médica',     c: 'verde', i: 'pulso' },
  resultado: { t: 'Resultado de examen', c: 'azul',  i: 'archivo' },
  documento: { t: 'Documento',           c: 'ambar', i: 'subir' }
}

/** Una entrada de la historia clínica. */
export default function ItemHistoria({ h }) {
  const tipo = TIPOS[h.tipo] || TIPOS.documento
  return (
    <div className="item">
      <span className={'ic ' + tipo.c}><Icono nombre={tipo.i} tam={20} /></span>
      <div className="cuerpo">
        <div className="entre" style={{ gap: '.4rem' }}>
          <b>{h.titulo}</b><span className="pill">{tipo.t}</span>
        </div>
        <span className="meta">{fechaLarga(h.fecha)} · {h.autor}</span>
        <p className="pequeno">{h.detalle}</p>
        {h.archivo && (
          <span className="tenue pequeno fila" style={{ gap: '.3rem' }}>
            <Icono nombre="archivo" tam={16} />{h.archivo}
          </span>
        )}
      </div>
    </div>
  )
}
