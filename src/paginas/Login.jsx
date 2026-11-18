import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icono from '../componentes/Icono'
import { useApp } from '../contexto/AppContext'
import { nombreMedico } from '../servicios/api'
import { usuarios as USUARIOS_PRUEBA, especialidades as ESPECIALIDADES_PRUEBA } from '../datos/mock'
import { CLAVE_DEMO_SUPABASE } from '../servicios/mapeo'
import { iniciales } from '../datos/utiles'
import FormularioPaciente from './FormularioPaciente'
import { FOTOS } from '../datos/imagenes'

const ROLES = [
  { valor: 'paciente', txt: 'Paciente', icono: 'usuario' },
  { valor: 'medico', txt: 'Médico', icono: 'estetoscopio' },
  { valor: 'auxiliar', txt: 'Auxiliar', icono: 'usuarios' },
  { valor: 'admin', txt: 'Admin', icono: 'ajustes' }
]

/* Usuarios de prueba que se muestran según el rol elegido. Salen de la lista fija de
   mock.js porque, con Supabase, antes de iniciar sesión no se puede leer la base. */
const DEMOS = { paciente: ['u1', 'u2'], medico: ['u3', 'u4', 'u5'], auxiliar: ['u6'], admin: ['u7'] }

const RUTA_INICIAL = { paciente: '/paciente', medico: '/medico', auxiliar: '/auxiliar', admin: '/admin' }

/* Mensajes que rotan sobre las fotos del lado izquierdo. */
const MENSAJES = [
  { foto: FOTOS.vereda, pos: 'center 25%', titulo: 'La consulta médica llega hasta tu vereda',
    texto: 'Pide tu cita y habla con el médico por videollamada, sin salir de tu corregimiento.' },
  { foto: FOTOS.celular, pos: 'center 35%', titulo: 'Funciona con internet lento',
    texto: 'Si se corta la llamada, vuelves a entrar con el mismo botón y tu cita sigue ahí.' },
  { foto: FOTOS.cercania, pos: 'center 30%', titulo: 'Nunca entras solo',
    texto: 'El auxiliar de salud de tu puesto te ayuda a registrarte y a conectarte.' },
  { foto: FOTOS.historia, pos: 'center', titulo: 'Tu historia clínica en un solo lugar',
    texto: 'Consultas, resultados y fórmulas. Solo los ve el personal que te atiende.' }
]
const SEGUNDOS_POR_MENSAJE = 7

export default function Login() {
  const { entrar, entrarDirecto, setModal, usaSupabase } = useApp()
  const [ocupado, setOcupado] = useState(false)
  const navegar = useNavigate()
  const [rol, setRol] = useState('paciente')
  const [doc, setDoc] = useState('')
  const [clave, setClave] = useState('')
  const [verClave, setVerClave] = useState(false)

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

  const abrirRecuperar = () => setModal({
    titulo: 'Recuperar mi contraseña',
    contenido: (cerrar) => <RecuperarClave alCerrar={cerrar} />
  })

  return (
    <div className="acceso">
      <Carrusel />

      <section className="acceso-form">
        <div className="acceso-caja">
          <header className="stack" style={{ gap: '.3rem' }}>
            <h2>Bienvenido a SISB</h2>
            <p className="tenue">Entra con tu número de documento y tu contraseña.</p>
          </header>

          <div className="seccion" style={{ gap: '.4rem' }}>
            <span className="etiqueta" id="quien-eres">¿Quién eres?</span>
            <div className="selector-rol" role="group" aria-labelledby="quien-eres">
              {ROLES.map((r) => (
                <button key={r.valor} type="button" aria-pressed={rol === r.valor} onClick={() => setRol(r.valor)}>
                  <Icono nombre={r.icono} tam={22} /><span>{r.txt}</span>
                </button>
              ))}
            </div>
          </div>

          <form className="stack" style={{ gap: '.9rem' }} onSubmit={enviar}>
            <div className="campo">
              <label htmlFor="acceso-doc">Número de documento</label>
              <span className="campo-icono">
                <Icono nombre="usuario" tam={20} />
                <input id="acceso-doc" value={doc} onChange={(e) => setDoc(e.target.value)} inputMode="numeric"
                       autoComplete="username" placeholder="Ej: 1045882331" required />
              </span>
            </div>
            <div className="campo">
              <div className="entre">
                <label htmlFor="acceso-clave">Contraseña</label>
                <button type="button" className="enlace" onClick={abrirRecuperar}>¿La olvidaste?</button>
              </div>
              <span className="campo-icono con-boton">
                <Icono nombre="candado" tam={20} />
                <input id="acceso-clave" type={verClave ? 'text' : 'password'} value={clave}
                       onChange={(e) => setClave(e.target.value)}
                       autoComplete="current-password" placeholder="Tu contraseña" required />
                <button type="button" className="ver-clave" aria-pressed={verClave}
                        aria-label={verClave ? 'Ocultar la contraseña' : 'Mostrar la contraseña'}
                        onClick={() => setVerClave(!verClave)}>
                  <Icono nombre={verClave ? 'ojoCerrado' : 'ojo'} tam={20} />
                </button>
              </span>
            </div>
            <button className="btn ancho" type="submit" disabled={ocupado}>{ocupado ? 'Entrando…' : 'Entrar'}</button>
          </form>

          {rol === 'paciente' && (
            <>
              <div className="separador">¿Primera vez aquí?</div>
              <button className="btn secundario ancho" onClick={abrirRegistro}>Crear mi cuenta</button>
            </>
          )}

          <details className="demo">
            <summary>
              <span className="pill info">Demo</span>
              <span>Entrar con un usuario de prueba</span>
              <Icono nombre="flecha" tam={18} />
            </summary>
            <p className="ayuda">
              Toca uno para entrar directo como {ROLES.find((r) => r.valor === rol).txt.toLowerCase()}.
              La contraseña de todos es <b>{usaSupabase ? CLAVE_DEMO_SUPABASE : '1234'}</b>.
            </p>
            <div className="demo-lista">
              {DEMOS[rol].map((id) => {
                const p = USUARIOS_PRUEBA.find((x) => x.id === id)
                return (
                  <button key={id} className="demo-item" disabled={ocupado} onClick={() => entrarComo(p)}>
                    <span className="avatar">{iniciales(p.nombre)}</span>
                    <span className="demo-txt">
                      <b>{p.rol === 'medico' ? nombreMedico(p) : p.nombre}</b>
                      <span>
                        {p.rol === 'medico' ? ESPECIALIDADES_PRUEBA.find((e) => e.id === p.espId).nombre : (p.vereda || p.puesto || p.cargo || '')}
                        {' · '}<span className="num">{p.doc}</span>
                      </span>
                    </span>
                    <Icono nombre="flecha" tam={18} />
                  </button>
                )
              })}
            </div>
          </details>

          <p className="acceso-pie">
            Prototipo académico — Ingeniería de Software, Universidad de la Costa.
            Fotos: <a href="https://unsplash.com" target="_blank" rel="noreferrer">Unsplash</a>.
          </p>
        </div>
      </section>
    </div>
  )
}

/** Lado izquierdo: fotos que cambian solas, cada una con un mensaje corto. */
function Carrusel() {
  const [activa, setActiva] = useState(0)
  const [pausa, setPausa] = useState(false)
  /* Las fotos se piden de a una (la que se ve y la siguiente) para no gastar datos de entrada. */
  const [cargadas, setCargadas] = useState(1)
  const sinMovimiento = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const quieta = pausa || sinMovimiento

  useEffect(() => {
    setCargadas((n) => Math.max(n, Math.min(activa + 2, MENSAJES.length)))
    if (quieta) return
    const t = setTimeout(() => setActiva((a) => (a + 1) % MENSAJES.length), SEGUNDOS_POR_MENSAJE * 1000)
    return () => clearTimeout(t)
  }, [activa, quieta])

  const m = MENSAJES[activa]
  return (
    <aside className="acceso-visual" onMouseEnter={() => setPausa(true)} onMouseLeave={() => setPausa(false)}>
      {MENSAJES.slice(0, cargadas).map((x, i) => (
        <img key={x.foto} className="acceso-foto" src={x.foto} alt="" data-activa={i === activa}
             style={{ objectPosition: x.pos }} />
      ))}
      <div className="acceso-velo" />

      <div className="marca clara">
        <span className="logo"><Icono nombre="pulso" tam={22} /></span>
        <span>SISB<small>Sistema Integral de Salud y Bienestar</small></span>
      </div>

      <div className="acceso-mensaje">
        <span className="sobretitulo">Telesalud rural · Pueblo Nuevo, Córdoba</span>
        <div className="acceso-texto" key={activa}>
          <h1>{m.titulo}</h1>
          <p>{m.texto}</p>
        </div>
        <div className="acceso-barras">
          {MENSAJES.map((x, i) => (
            <button key={x.titulo} type="button" aria-current={i === activa}
                    aria-label={'Mensaje ' + (i + 1) + ' de ' + MENSAJES.length + ': ' + x.titulo}
                    onClick={() => setActiva(i)}>
              <i className={i !== activa ? '' : quieta ? 'llena' : 'corre'}
                 style={{ animationDuration: SEGUNDOS_POR_MENSAJE + 's' }} />
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}

/** Recuperar contraseña (R.1-3). */
function RecuperarClave({ alCerrar }) {
  const { acciones, usaSupabase } = useApp()

  /* Con Supabase las cuentas no tienen un correo real al cual enviar un enlace:
     la contraseña la restablece el personal, verificando la identidad en persona. */
  if (usaSupabase) return (
    <>
      <p>Acércate a tu puesto de salud con tu documento. El auxiliar confirma que eres tú y te ayuda a crear una contraseña nueva.</p>
      <div className="fila" style={{ justifyContent: 'flex-end' }}>
        <button className="btn" onClick={alCerrar}>Entendido</button>
      </div>
    </>
  )

  const enviar = (e) => {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.target).entries())
    if (acciones.restablecerClave(f.doc, f.tel, f.clave)) alCerrar()
  }
  return (
    <form className="stack" onSubmit={enviar}>
      <p className="ayuda">Para confirmar que eres tú, escribe tu documento y el teléfono con el que te registraste.</p>
      <label className="campo">Número de documento
        <input name="doc" inputMode="numeric" required placeholder="Ej: 1045882331" />
      </label>
      <label className="campo">Teléfono registrado
        <input name="tel" inputMode="tel" required placeholder="Ej: 310 455 2201" />
      </label>
      <label className="campo">Contraseña nueva
        <input name="clave" type="password" required minLength={4} placeholder="Mínimo 4 caracteres" />
      </label>
      <p className="ayuda">¿No recuerdas el teléfono? En tu puesto de salud te ayudan a cambiarla.</p>
      <div className="fila" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn fantasma" onClick={alCerrar}>Cancelar</button>
        <button className="btn" type="submit"><Icono nombre="check" tam={20} /> Cambiar contraseña</button>
      </div>
    </form>
  )
}
