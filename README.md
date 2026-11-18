# SISB — Sistema Integral de Salud y Bienestar

Plataforma web de telesalud que conecta la zona rural de Pueblo Nuevo, Córdoba (corregimientos, veredas y caseríos) con profesionales
de la salud: agendamiento de citas, teleconsulta por videollamada e historia clínica digital.

Proyecto de la asignatura de Ingeniería de Software — Universidad de la Costa (CUC).
Integrantes: Roberto Cortes, Roiner Mejía, Camilo Ruiz, Santiago Carbal.

---

## 1. Cómo ponerlo a correr

Necesitas tener instalado **Node.js 18 o superior** (https://nodejs.org).

1. Abre la carpeta `sisb-web` en Visual Studio Code.
2. Abre la terminal (menú `Terminal` → `Nueva terminal`) y escribe:

```bash
npm install     # instala las librerías (solo la primera vez)
npm run dev     # arranca el proyecto
```

3. Se abre solo en el navegador, en `http://localhost:5173`.

Para detenerlo: `Ctrl + C` en la terminal.

---

## 2. Usuarios de prueba

La contraseña de todos es **1234**. En la pantalla de ingreso, elige el perfil,
abre **«Entrar con un usuario de prueba»** y toca cualquiera de la lista para entrar directo.

| Rol | Nombre | Documento |
|---|---|---|
| Paciente | María Paulina Gutiérrez | 1045882331 |
| Paciente | José Nel Ariza Mendoza | 8744120 |
| Médico | Dra. Luz Mery Pacheco (medicina general) | 52998114 |
| Médico | Dr. Andrés Valencia Ruiz (pediatría) | 79110233 |
| Médico | Dra. Sandra Ospino Caro (ginecología) | 22811904 |
| Auxiliar | Nelson Barrios Molina | 1082331445 |
| Administrador | Camilo Ruiz Alquichire | 1140899210 |

**Recorrido recomendado para la sustentación**

1. Entra como *María Paulina* → pide una cita (4 pasos) → míralas en *Mis citas*.
2. Entra como *Dra. Luz Mery Pacheco* → en *Mi agenda* está José Nel con cita hoy
   → *Iniciar videollamada* → escribe el diagnóstico → *Guardar en la historia clínica*.
3. Vuelve a entrar como *José Nel* y verás el registro nuevo en su historia.
4. *Nelson Barrios* (auxiliar) registra pacientes y sube resultados.
5. *Camilo Ruiz* (administrador) gestiona usuarios, especialidades y ve el resumen.

---

## 3. Estructura del proyecto

```
sisb-web/
├─ index.html                  Página base donde se monta React
├─ package.json                Librerías y comandos del proyecto
├─ vite.config.js              Configuración del servidor de desarrollo
├─ vercel.json                 Para que las rutas funcionen al desplegar
├─ .env.example                Plantilla de las llaves de Supabase
└─ src/
   ├─ main.jsx                 Punto de arranque
   ├─ App.jsx                  Rutas de toda la aplicación
   ├─ estilos.css              Paleta, tipografía y componentes visuales
   ├─ datos/
   │  ├─ mock.js               Usuarios de prueba fijos
   │  ├─ generador.js          Genera ~1.200 pacientes y miles de citas realistas
   │  └─ utiles.js             Funciones de fecha y texto
   ├─ servicios/
   │  ├─ api.js                Consultas a los datos (con índices para miles de registros)
   │  ├─ supabase.js           Interruptor modo local / modo Supabase
   │  ├─ repositorio.js        Lecturas y escrituras a Supabase
   │  └─ mapeo.js              Nombres de la app ↔ columnas de la base
   ├─ contexto/
   │  └─ AppContext.jsx        Sesión, datos y acciones compartidas
   ├─ componentes/
   │  ├─ Shell.jsx             Barra superior y menú de cada rol
   │  ├─ Icono.jsx             Catálogo de iconos SVG
   │  ├─ Modal.jsx             Ventanas de confirmación
   │  ├─ Avisos.jsx            Mensajes de éxito y error
   │  └─ ItemHistoria.jsx      Entrada de la historia clínica
   └─ paginas/
      ├─ Login.jsx             Ingreso por rol (R.1, R.2)
      ├─ FormularioPaciente.jsx Registro de pacientes
      ├─ Videollamada.jsx      Teleconsulta (R.6)
      ├─ paciente/             Inicio, Agendar, MisCitas, Perfil (R.3, R.4, R.7)
      ├─ medico/               Agenda, Horarios, Pacientes (R.5)
      ├─ auxiliar/             Apoyo, SubirDocumentos (R.8)
      └─ admin/                Usuarios, Especialidades, Resumen (R.9)
```

---

## 4. Requerimientos implementados

| Ref. | Función | Dónde está |
|---|---|---|
| R.1 | Registro, inicio de sesión y recuperación de contraseña | `paginas/Login.jsx`, `FormularioPaciente.jsx` |
| R.2 | Inicio de sesión de médico, auxiliar y administrador | `paginas/Login.jsx`, `App.jsx` (rutas privadas) |
| R.3 | Agendamiento de citas por especialidad | `paginas/paciente/Agendar.jsx` |
| R.4 | Consulta, reprogramación y cancelación de citas | `paginas/paciente/MisCitas.jsx` |
| R.5 | Agenda y horarios del médico | `paginas/medico/Agenda.jsx`, `Horarios.jsx` |
| R.6 | Teleconsulta por videollamada | `paginas/Videollamada.jsx` |
| R.7 | Perfil, historia, resultados, trámites y fórmulas | `paginas/paciente/Perfil.jsx` |
| R.8 | Carga de historias clínicas y resultados | `paginas/auxiliar/SubirDocumentos.jsx` |
| R.9 | Gestión de usuarios y especialidades | `paginas/admin/` |

---

## 5. Decisiones de accesibilidad

El público objetivo son personas con baja alfabetización digital y conexión inestable:

- Botón **A+** en la barra superior para agrandar la letra en toda la plataforma.
- Botones grandes (mínimo 50 px de alto) y un paso a la vez al agendar.
- Lenguaje llano, sin tecnicismos ("Te falta hacer esto", "Cuéntanos qué te pasa").
- Instrucciones de qué hacer si se cae la videollamada.
- Interfaz clara en modo claro y oscuro, y funciona igual en celular.

---

## 6. Base de datos (Supabase) — lista para conectar

Sin llaves en el `.env`, la app funciona en **modo local**: datos de prueba en memoria
(unos 1.200 pacientes y miles de citas generados) que se reinician al recargar.

Todo lo necesario para pasar a **Supabase** ya está hecho: esquema SQL con seguridad por rol,
script de carga de datos, función para crear cuentas y el interruptor automático en la app.
Conectarlo toma unos 15 minutos: **sigue la guía [`SUPABASE.md`](SUPABASE.md)**.

Lo que sigue pendiente:

- La videollamada es una maqueta. Se integra con **Jitsi Meet** usando el identificador de
  sala que ya genera `Videollamada.jsx`.

---

## 7. Publicar en internet (Vercel)

1. Subir el proyecto a GitHub.
2. Entrar a https://vercel.com, *Add New → Project* e importar el repositorio.
3. Vercel detecta Vite solo. Dar *Deploy*.
4. Cuando existan las llaves de Supabase, agregar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
   en *Settings → Environment Variables* y hacer *Redeploy* (detalle en `SUPABASE.md`, paso 8).

Hoy está publicado en **https://sisb-pi.vercel.app** y se actualiza solo con cada `git push` a `main`.
