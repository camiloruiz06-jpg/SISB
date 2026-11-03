import React from 'react'
import { useApp } from '../contexto/AppContext'

/**
 * Ventana de confirmación. Se abre desde cualquier pantalla con:
 *   setModal({ titulo, cuerpo, confirmar, peligro, alConfirmar })
 * También sirve como contenedor de formularios pasando "contenido".
 */
export default function Modal() {
  const { modal, setModal } = useApp()
  if (!modal) return null
  const cerrar = () => setModal(null)

  return (
    <div className="modal-fondo" role="dialog" aria-modal="true" aria-label={modal.titulo}
         onClick={(e) => { if (e.target === e.currentTarget) cerrar() }}>
      <div className="modal">
        <h2>{modal.titulo}</h2>
        {modal.contenido ? modal.contenido(cerrar) : (
          <>
            <div className="tenue">{modal.cuerpo}</div>
            <div className="fila" style={{ justifyContent: 'flex-end' }}>
              <button className="btn secundario" onClick={cerrar}>{modal.cancelar || 'No, volver'}</button>
              <button className={'btn' + (modal.peligro ? ' peligro' : '')}
                      onClick={() => { cerrar(); modal.alConfirmar && modal.alConfirmar() }}>
                {modal.confirmar || 'Sí, continuar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
