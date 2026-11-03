import React from 'react'
import Icono from './Icono'

/**
 * Controles de página para listas largas.
 * Uso:  const visibles = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
 *       <Paginacion total={lista.length} pagina={pagina} porPagina={POR_PAGINA} alCambiar={setPagina} />
 */
export default function Paginacion({ total, pagina, porPagina, alCambiar }) {
  const paginas = Math.max(1, Math.ceil(total / porPagina))
  if (total <= porPagina) return null
  const desde = (pagina - 1) * porPagina + 1
  const hasta = Math.min(total, pagina * porPagina)
  const n = (x) => x.toLocaleString('es-CO')

  return (
    <nav className="paginacion" aria-label="Páginas">
      <span className="tenue pequeno">Mostrando <b>{n(desde)}–{n(hasta)}</b> de <b>{n(total)}</b></span>
      <div className="fila" style={{ gap: '.35rem', flexWrap: 'nowrap' }}>
        <button className="iconbtn chico" disabled={pagina === 1} onClick={() => alCambiar(pagina - 1)} aria-label="Página anterior">
          <Icono nombre="atras" tam={18} />
        </button>
        <span className="pequeno num" style={{ fontWeight: 700, minWidth: 64, textAlign: 'center' }}>{pagina} de {paginas}</span>
        <button className="iconbtn chico girar" disabled={pagina === paginas} onClick={() => alCambiar(pagina + 1)} aria-label="Página siguiente">
          <Icono nombre="atras" tam={18} />
        </button>
      </div>
    </nav>
  )
}
