/* ===========================================================
   Fotos de la plataforma (Unsplash, licencia libre).
   Se piden comprimidas y en formato automático (WebP/AVIF) para
   que carguen rápido con internet lento. Para cambiar una foto,
   basta con cambiar el código "photo-..." de la dirección.
   =========================================================== */
const unsplash = (id, ancho) => `https://images.unsplash.com/${id}?w=${ancho}&q=55&auto=format&fit=crop`

export const FOTOS = {
  /* Médica en su consultorio, mirando a la cámara (como en una teleconsulta). */
  login: unsplash('photo-1758691462651-611d730c5272', 1100),
  /* Médica atendiendo a un paciente. */
  consulta: unsplash('photo-1758691462878-6edc3d3da1be', 900)
}
