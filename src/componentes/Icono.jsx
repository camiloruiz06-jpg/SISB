import React from 'react'

/* Catálogo de iconos del sistema (SVG dibujados a mano, sin librerías externas). */
const TRAZOS = {
  inicio:'<path d="M3 9.5 12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9.5 22v-8h5v8"/>',
  calendario:'<rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M8 2.5v4M16 2.5v4M3 10h18"/>',
  agendar:'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  usuario:'<path d="M20 21v-1.5a4.5 4.5 0 0 0-4.5-4.5h-7A4.5 4.5 0 0 0 4 19.5V21"/><circle cx="12" cy="7.5" r="4"/>',
  usuarios:'<path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16.5 3.3a4 4 0 0 1 0 7.4"/>',
  video:'<path d="M23 7.5 16 12l7 4.5z"/><rect x="1" y="5" width="15" height="14" rx="2.5"/>',
  archivo:'<path d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8z"/><path d="M14 2.5V8h5.5M8.5 13h7M8.5 17h5"/>',
  reloj:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5.5l3.5 2"/>',
  check:'<path d="M20 6.5 9.5 17 4 11.5"/>',
  equis:'<path d="M18 6 6 18M6 6l12 12"/>',
  subir:'<path d="M21 15.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3.5"/><path d="M16.5 8 12 3.5 7.5 8M12 3.5V15"/>',
  ajustes:'<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2.2"/><circle cx="10" cy="17" r="2.2"/>',
  salir:'<path d="M9.5 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4.5"/><path d="M16.5 16.5 21 12l-4.5-4.5M21 12H9"/>',
  alerta:'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4M12 17.3h.01"/>',
  pulso:'<path d="M22 12h-4l-3 8-6-16-3 8H2"/>',
  editar:'<path d="M11 4.5H4.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V13"/><path d="M18.4 2.6a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/>',
  borrar:'<path d="M3.5 6h17M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3.5 0V4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2"/>',
  atras:'<path d="M19.5 12H5M12 19l-7-7 7-7"/>',
  receta:'<path d="M5 3.5h9l5 5v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2z"/><path d="M8 12h8M8 16h5M8 8h3"/>',
  mapa:'<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
  antena:'<path d="M5 12a7 7 0 0 1 14 0"/><path d="M8.5 12a3.5 3.5 0 0 1 7 0"/><path d="M12 12v9"/>',
  mic:'<rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5"/>',
  escudo:'<path d="M12 2.5 4 6v6c0 5 3.4 8.6 8 9.5 4.6-.9 8-4.5 8-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
  buscar:'<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.5-4.5"/>',
  telefono:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>'
}

/**
 * Icono reutilizable.
 * Uso:  <Icono nombre="calendario" tam={22} />
 */
export default function Icono({ nombre, tam = 22 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tam}
      height={tam}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: TRAZOS[nombre] || '' }}
    />
  )
}
