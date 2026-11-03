import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuración de Vite. Con "npm run dev" el proyecto se abre en http://localhost:5173
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: true }
})
