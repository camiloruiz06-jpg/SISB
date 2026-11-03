import React from 'react'
import Icono from './Icono'
import { useApp } from '../contexto/AppContext'

/** Mensajes de confirmación o error que aparecen abajo de la pantalla. */
export default function Avisos() {
  const { avisos } = useApp()
  return (
    <div className="avisos" aria-live="polite">
      {avisos.map((a) => (
        <div key={a.id} className={'aviso' + (a.tipo === 'error' ? ' error' : '')}>
          <span className="ic"><Icono nombre={a.tipo === 'error' ? 'alerta' : 'check'} tam={20} /></span>
          <span>{a.texto}</span>
        </div>
      ))}
    </div>
  )
}
