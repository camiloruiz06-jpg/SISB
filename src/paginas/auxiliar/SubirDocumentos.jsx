import React, { useState } from 'react'
import Icono from '../../componentes/Icono'
import { useApp } from '../../contexto/AppContext'
import BuscadorPaciente from '../../componentes/BuscadorPaciente'
import { iniciales } from '../../datos/utiles'

/**
 * Carga de exámenes y documentos a la historia clínica.
 * Con Supabase, el archivo se sube a Storage y aquí solo se guarda la ruta.
 */
export default function SubirDocumentos() {
  const { sesion, acciones, aviso } = useApp()
  const [paciente, setPaciente] = useState(null)
  const [archivo, setArchivo] = useState(null)
  const [encima, setEncima] = useState(false)

  const enviar = (e) => {
    e.preventDefault()
    if (!paciente) return aviso('Primero busca y elige al paciente.', 'error')
    const f = new FormData(e.target)
    acciones.subirDocumento({
      pacienteId: paciente.id,
      tipo: f.get('tipo'),
      titulo: f.get('titulo'),
      detalle: f.get('detalle'),
      archivo,                        // el archivo real: con Supabase se sube a Storage
      autor: 'Auxiliar ' + sesion.nombre
    })
    e.target.reset()
    setArchivo(null)
  }

  const kb = (n) => (n > 1024 * 1024 ? (n / 1024 / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB')

  return (
    <div className="vista" style={{ maxWidth: 720 }}>
      <div className="titulo-vista">
        <h1>Subir documentos</h1>
        <span className="tenue">Exámenes, órdenes, carnés o cualquier papel del paciente.</span>
      </div>

      <form className="stack" style={{ gap: '1.2rem' }} onSubmit={enviar}>
        <div className="campo">
          <span style={{ fontWeight: 700, fontSize: '.92rem' }}>1. ¿De quién es el documento?</span>
          {paciente ? (
            <div className="item" style={{ border: '1.5px solid var(--primary)', borderRadius: 10, alignItems: 'center', background: 'var(--primary-soft)' }}>
              <span className="avatar">{iniciales(paciente.nombre)}</span>
              <div className="cuerpo"><b>{paciente.nombre}</b><span className="meta">C.C. {paciente.doc} · {paciente.vereda || paciente.municipio}</span></div>
              <button type="button" className="btn pequeno fantasma" onClick={() => setPaciente(null)}>Cambiar</button>
            </div>
          ) : <BuscadorPaciente alElegir={setPaciente} autoFoco={false} />}
        </div>

        <div className="campo" role="radiogroup" aria-label="Tipo de documento">
          <span style={{ fontWeight: 700, fontSize: '.92rem' }}>2. ¿Qué tipo de documento es?</span>
          <div className="segmentado">
            <label><input type="radio" name="tipo" value="resultado" defaultChecked /><Icono nombre="pulso" tam={18} /> Examen</label>
            <label><input type="radio" name="tipo" value="documento" /><Icono nombre="archivo" tam={18} /> Otro documento</label>
          </div>
        </div>

        <label className="campo">3. Título<input name="titulo" required placeholder="Ej: Cuadro hemático" /></label>

        <label className="campo">Descripción (opcional)
          <textarea name="detalle" placeholder="Escribe lo importante del documento." />
        </label>

        <div className="campo">
          <span style={{ fontWeight: 700, fontSize: '.92rem' }}>4. Archivo</span>
          <label className={'zona-archivo' + (encima ? ' encima' : '') + (archivo ? ' lista' : '')}
                 onDragEnter={() => setEncima(true)} onDragLeave={() => setEncima(false)} onDrop={() => setEncima(false)}>
            <input name="archivo" type="file" accept="image/*,.pdf"
                   onChange={(e) => setArchivo(e.target.files[0] || null)} />
            <span className="ic"><Icono nombre={archivo ? 'check' : 'subir'} tam={24} /></span>
            {archivo ? (
              <>
                <b style={{ overflowWrap: 'anywhere' }}>{archivo.name}</b>
                <span className="ayuda">{kb(archivo.size)} · Toca para cambiarlo</span>
              </>
            ) : (
              <>
                <b>Toca aquí para elegir el archivo</b>
                <span className="ayuda">PDF o foto. Puedes tomarle una foto al papel con el celular.</span>
              </>
            )}
          </label>
        </div>

        <button className="btn ancho" type="submit">
          <Icono nombre="subir" tam={20} /> Guardar en la historia clínica
        </button>
      </form>
    </div>
  )
}
