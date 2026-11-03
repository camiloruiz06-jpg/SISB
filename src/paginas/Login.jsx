import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icono from '../componentes/Icono'
import { useApp } from '../contexto/AppContext'
import { nombreMedico } from '../servicios/api'
import { usuarios as USUARIOS_PRUEBA, especialidades as ESPECIALIDADES_PRUEBA } from '../datos/mock'
import { CLAVE_DEMO_SUPABASE } from '../servicios/mapeo'
import FormularioPaciente from './FormularioPaciente'
import { FOTOS } from '../datos/imagenes'

/* Usuarios de prueba que se muestran según el rol elegido. Salen de la lista fija de
   mock.js porque, con Supabase, antes de iniciar sesión no se puede leer la base. */
const DEMOS = { paciente: ['u1', 'u2'], medico: ['u3', 'u4', 'u5'], auxiliar: ['u6'], admin: ['u7'] }

const RUTA_INICIAL = { paciente: '/paciente', medico: '/medico', auxiliar: '/auxiliar', admin: '/admin' }

export default function Login() {
  const { entrar, entrarDirecto, setModal, usaSupabase } = useApp()
  const [ocupado, setOcupado] = useState(false)
  const navegar = useNavigate()
  const [rol, setRol] = useState('paciente')
  const [doc, setDoc] = useState('')
  const [clave, setClave] = useState('')

  const enviar = async (e) => {
    e.preventDefault()
    setOcupado(true)
    const usuario = await entrar(doc.trim(), clave, rol)
    setOcupado(false)
    if (usuario) navegar(RUTA_INICIAL[usuario.rol])
  }

  const entrarComo = async (usuario) => {
    setOcupado(true)
    const ok = await entrarDirecto(usuario)
    setOcupado(false)
    if (ok) navegar(RUTA_INICIAL[usuario.rol])
  }

  const abrirRegistro = () => setModal({
    titulo: 'Crear mi cuenta',
    contenido: (cerrar) => (
      <FormularioPaciente alTerminar={(nuevo) => { cerrar(); entrarComo(nuevo) }} alCancelar={cerrar} />
    )
  })

  const Rol = ({ valor, etiqueta, icono }) => (
    <button className="rol" aria-pressed={rol === valor} onClick={() => setRol(valor)}>
      <span className="ic-rol"><Icono nombre={icono} tam={22} /></span><span>{etiqueta}</span>
    </button>
  )

  return (
    <div className="portada">
      <section className="portada-info" style={{ '--foto': `url(${FOTOS.login})` }}>
        <div className="marca">
          <span className="logo"><Icono nombre="pulso" tam={22} /></span>
          <span>SISB<small>Sistema Integral de Salud y Bienestar</small></span>
        </div>
        <div className="stack" style={{ gap: '.9rem' }}>
          <h1>La consulta médica llega hasta <span className="resaltado">tu vereda</span></h1>
          <p>Pide tu cita, habla con el médico por videollamada y consulta tu historia clínica sin salir de tu municipio.</p>
        </div>
        <div className="puntos">
          <div className="punto"><span className="ic-punto"><Icono nombre="antena" tam={19} /></span><div><b>Funciona con internet lento</b><span>Si se corta la llamada, vuelves a entrar con el mismo botón.</span></div></div>
          <div className="punto"><span className="ic-punto"><Icono nombre="telefono" tam={19} /></span><div><b>Te ayudamos a entrar</b><span>El auxiliar de salud de tu puesto te acompaña.</span></div></div>
          <div className="punto"><span className="ic-punto"><Icono nombre="escudo" tam={19} /></span><div><b>Tu información es privada</b><span>Solo la ve el personal de salud que te atiende.</span></div></div>
        </div>
        <p className="pequeno tenue">Prototipo académico — Ingeniería de Software, Universidad de la Costa.
          <span className="credito-foto"> · Foto: <a href="https://unsplash.com" target="_blank" rel="noreferrer">Unsplash</a></span></p>
      </section>

      <section className="portada-form">
       <div className="form-card">
        <div className="stack" style={{ gap: '.3rem' }}>
          <h2>Entrar a la plataforma</h2>
          <p className="ayuda">Primero, toca quién eres.</p>
        </div>

        <div className="roles">
          <Rol valor="paciente" etiqueta="Soy paciente" icono="usuario" />
          <Rol valor="medico" etiqueta="Soy médico" icono="pulso" />
          <Rol valor="auxiliar" etiqueta="Soy auxiliar" icono="usuarios" />
          <Rol valor="admin" etiqueta="Administrador" icono="ajustes" />
        </div>

        <form className="stack" style={{ gap: '.8rem' }} onSubmit={enviar}>
          <label className="campo">Número de documento
            <input value={doc} onChange={(e) => setDoc(e.target.value)} inputMode="numeric"
                   autoComplete="username" placeholder="Ej: 1045882331" required />
          </label>
          <label className="campo">Contraseña
            <input type="password" value={clave} onChange={(e) => setClave(e.target.value)}
                   autoComplete="current-password" placeholder="••••" required />
          </label>
          <button className="btn ancho" type="submit" disabled={ocupado}>{ocupado ? 'Entrando…' : 'Entrar'} <Icono nombre="salir" tam={20} /></button>
        </form>

        {rol === 'paciente' && (
          <>
            <div className="separador">¿Primera vez aquí?</div>
            <button className="btn secundario ancho" onClick={abrirRegistro}><Icono nombre="usuario" tam={20} /> Crear mi cuenta</button>
          </>
        )}

        <div className="demo">
          <b className="pequeno">Usuarios de prueba</b>
          <span className="ayuda"> — toca uno para entrar directo (la contraseña de todos es {usaSupabase ? CLAVE_DEMO_SUPABASE : '1234'}).</span>
          <div className="demo-lista">
            {DEMOS[rol].map((id) => {
              const p = USUARIOS_PRUEBA.find((x) => x.id === id)
              return (
                <button key={id} className="demo-item" disabled={ocupado} onClick={() => entrarComo(p)}>
                  <span>
                    <b>{p.rol === 'medico' ? nombreMedico(p) : p.nombre}</b><br />
                    <span className="tenue pequeno">
                      {p.rol === 'medico' ? ESPECIALIDADES_PRUEBA.find((e) => e.id === p.espId).nombre : (p.municipio || p.puesto || p.cargo || '')}
                    </span>
                  </span>
                  <code>{p.doc}</code>
                </button>
              )
            })}
          </div>
        </div>
       </div>
      </section>
    </div>
  )
}
