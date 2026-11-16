/* ===========================================================
   Fotos de la plataforma (Unsplash, licencia libre).
   Se piden comprimidas y en formato automático (WebP/AVIF) para
   que carguen rápido con internet lento. Para cambiar una foto,
   basta con cambiar el código "photo-..." de la dirección.
   =========================================================== */
const unsplash = (id, ancho) => `https://images.unsplash.com/${id}?w=${ancho}&q=55&auto=format&fit=crop`

export const FOTOS = {
  /* Médica atendiendo a un paciente (encabezado de las pantallas de inicio). */
  consulta: unsplash('photo-1758691462878-6edc3d3da1be', 900),

  /* Fotos que rotan en la pantalla de inicio de sesión. */
  vereda: unsplash('photo-1559839734-2b71ea197ec2', 1200),      // médica al aire libre
  celular: unsplash('photo-1576091160399-112ba8d25d1d', 1200),  // médico con el celular en la mano
  cercania: unsplash('photo-1631217868264-e5b90bb7e133', 1200), // médica conversando con una paciente
  historia: unsplash('photo-1576091160550-2173dba999ef', 1200)  // manos escribiendo junto a un estetoscopio
}
