import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ProveedorApp } from './contexto/AppContext'
import App from './App'
import './estilos.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ProveedorApp>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ProveedorApp>
  </React.StrictMode>
)
