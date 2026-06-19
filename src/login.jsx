import { useState } from 'react';

export default function Login({ setToken }) {
  const [esRegistro, setEsRegistro] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensajeExito('');

    const url = esRegistro 
      ? 'http://localhost:8000/api/auth/register' 
      : 'http://localhost:8000/api/auth/login';

    try {
      const respuesta = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.detail || 'Ocurrió un error inesperado');
      }

      if (esRegistro) {
        setMensajeExito('¡Usuario creado con éxito! Ya puedes iniciar sesión.');
        setEsRegistro(false);
        setPassword('');
      } else {
        localStorage.setItem('token_calendario', datos.access_token);
        localStorage.setItem('usuario_calendario', datos.user.username);
        setToken(datos.access_token);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={estilos.contenedor}>
      <div style={estilos.tarjeta}>
        {/* Aquí puedes cambiar el título principal */}
        <h2 style={estilos.titulo}>
          {esRegistro ? 'Crear Cuenta Universitaria' : 'Iniciar Sesión'}
        </h2>
        
        {/* Aquí cambias el subtítulo */}
        <p style={estilos.subtitulo}>Calendario Compartido Privado</p>

        <form onSubmit={handleSubmit} style={estilos.formulario}>
          <div style={estilos.grupoInput}>
            <label style={estilos.label}>Nombre de Usuario</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              placeholder="Aqui va tu Usuario"
              style={estilos.input}
            />
          </div>

          <div style={estilos.grupoInput}>
            <label style={estilos.label}>Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
              style={estilos.input}
            />
          </div>

          {error && <div style={estilos.error}>{error}</div>}
          {mensajeExito && <div style={estilos.exito}>{mensajeExito}</div>}

          <button type="submit" style={estilos.botonSubmit}>
            {esRegistro ? 'Registrarse' : 'Ingresar'}
          </button>
        </form>

        <div style={estilos.contenedorCambio}>
          <button 
            onClick={() => { setEsRegistro(!esRegistro); setError(''); setMensajeExito(''); }}
            style={estilos.botonCambio}
          >
            {esRegistro ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿No tienes cuenta? Regístrate aquí!'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 🎨 OBJETO DE ESTILOS BLINDADO (Arregla los textos movidos)
const estilos = {
  contenedor: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#0f172a',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 9999,
    fontFamily: 'sans-serif',
    boxSizing: 'border-box'
  },
  tarjeta: {
    backgroundColor: '#1e293b',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
    width: '100%',
    maxWidth: '360px',
    textAlign: 'center',
    border: '1px solid #334155',
    boxSizing: 'border-box'
  },
  titulo: {
    color: '#f8fafc',
    margin: '0 0 8px 0',
    fontSize: '26px',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  subtitulo: {
    color: '#94a3b8',
    fontSize: '14px',
    margin: '0 0 24px 0',
    textAlign: 'center'
  },
  formulario: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%'
  },
  grupoInput: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    alignItems: 'flex-start',
    width: '100%'
  },
  label: {
    color: '#cbd5e1',
    fontSize: '14px',
    fontWeight: '500',
    margin: 0,
    textAlign: 'left'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #475569',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontSize: '15px',
    boxSizing: 'border-box'
  },
  botonSubmit: {
    backgroundColor: '#38bdf8',
    color: '#0f172a',
    padding: '12px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px',
    width: '100%'
  },
  contenedorCambio: {
    marginTop: '20px',
    textAlign: 'center'
  },
  botonCambio: {
    background: 'none',
    border: 'none',
    color: '#38bdf8',
    cursor: 'pointer',
    fontSize: '13px',
    textDecoration: 'underline',
    padding: 0
  },
  error: {
    backgroundColor: '#451a1a',
    color: '#f87171',
    padding: '10px',
    border_radius: '6px',
    fontSize: '14px',
    border: '1px solid #7f1d1d',
    textAlign: 'center'
  },
  exito: {
    backgroundColor: '#064e3b',
    color: '#34d399',
    padding: '10px',
    border_radius: '6px',
    fontSize: '14px',
    border: '1px solid #065f46',
    textAlign: 'center'
  }
};