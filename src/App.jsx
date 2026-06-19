import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import Login from './Login'; // 🔑 Importante: Traemos tu nuevo componente de Login

const estilosInyectados = `
  .fc-toolbar-title {
    color: #2c3e50 !important;
    font-weight: 800 !important;
  }
  .fc-col-header-cell-cushion {
    color: #2c3e50 !important;
    font-weight: bold !important;
    text-transform: uppercase;
  }
  .fc-daygrid-day-number {
    color: #2c3e50 !important;
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = estilosInyectados;
  document.head.appendChild(styleSheet);
}

function App() {
  // 🔑 ESTADO MAESTRO: Revisa si ya hay una sesión guardada al abrir la página
  const [token, setToken] = useState(localStorage.getItem('token_calendario') || '');
  const [usuarioActivo, setUsuarioActivo] = useState(localStorage.getItem('usuario_calendario') || '');

  // 🛠️ CORRECCIÓN: Ahora declaramos la variable 'eventos' correctamente
  const [eventos, setEventos] = useState([]);
  const [modalAbierta, setModalAbierta] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [colorSeleccionado, setColorSeleccionado] = useState('#27ae60'); 

  const cargarEventos = () => {
    // 🔑 UNIFICADO: Conectamos directamente a localhost
    fetch('http://localhost:8000/api/eventos')
      .then(response => {
        if (!response.ok) throw new Error("Error al leer eventos");
        return response.json();
      })
      .then(data => setEventos(data))
      .catch(error => console.error("Error conectando con Python:", error));
  };

  // Solo carga los eventos si el usuario ya está autenticado
  useEffect(() => {
    if (token) {
      cargarEventos();
    }
  }, [token]);

  // 🔑 FUNCIÓN PARA CERRAR SESIÓN: Borra el almacén y bloquea la pantalla
  const manejarCerrarSesion = () => {
    localStorage.removeItem('token_calendario');
    localStorage.removeItem('usuario_calendario');
    setToken('');
    setUsuarioActivo('');
  };

  const handleDateClick = (arg) => {
    setFechaSeleccionada(arg.dateStr);
    setNuevoTitulo(''); 
    setModalAbierta(true); 
  };

  const manejarGuardar = (e) => {
    e.preventDefault(); 
    if (!nuevoTitulo.trim()) return alert("Por favor escribe un título");

    const nuevoEvento = {
      title: nuevoTitulo,
      start: fechaSeleccionada,
      color: colorSeleccionado
    };

    // 🔑 CORRECCIÓN CORS: Cambiado de 127.0.0.1 a localhost
    fetch('http://localhost:8000/api/eventos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoEvento),
    })
    .then(response => {
      if (!response.ok) throw new Error("Error al guardar evento");
      return response.json();
    })
    .then(() => {
      cargarEventos();
      setModalAbierta(false); 
    })
    .catch(error => console.error("Error al guardar:", error));
  };

  // 🚨 FILTRO DE SEGURIDAD EN REACT: Si no hay token, muestra la pantalla de Login
  if (!token) {
    return <Login setToken={(t) => {
      setToken(t);
      setUsuarioActivo(localStorage.getItem('usuario_calendario') || '');
    }} />;
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', position: 'relative' }}>
      
      {/* 👤 BARRA DE USUARIO SUPERIOR */}
      <div style={estilos.barraUsuario}>
        <span>Hola, <strong>{usuarioActivo}</strong> 👋</span>
        <button onClick={manejarCerrarSesion} style={estilos.botonSalir}>
          Cerrar Sesión
        </button>
      </div>

      <h1 style={{ textAlign: 'center', marginBottom: '5px' }}>Mi Calendario</h1>
      <h3 style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: '30px', fontWeight: 'normal' }}>
        React ⚛️ + FastAPI + Python 🐍
      </h3>
      
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="es"
          buttonText={{ today: 'Hoy' }}
          headerToolbar={{
            left: 'title', 
            center: '', 
            right: 'prev,today,next' 
          }}
          events={eventos}
          dateClick={handleDateClick}
          eventClick={(info) => {
            const confirmar = window.confirm(`¿Estás seguro de que quieres eliminar el evento "${info.event.title}"?`);
            if (confirmar) {
              // 🔑 CORRECCIÓN CORS: Cambiado de 127.0.0.1 a localhost
              fetch(`http://localhost:8000/api/eventos/${info.event.id}`, {
                method: 'DELETE',
              })
              .then(response => response.json())
              .then(() => {
                cargarEventos(); 
              })
              .catch(error => console.error("Error al eliminar:", error));
            }
          }}
        />
      </div>

      {/* TARJETA FLOTANTE (MODAL CUSTOM) */}
      {modalAbierta && (
        <div style={estilos.overlay}>
          <div style={estilos.tarjeta}>
            <h2 style={{ marginTop: 0, color: '#2c3e50' }}>Nuevo Evento</h2>
            <p style={{ color: '#041618' }}>Fecha: {fechaSeleccionada}</p>
            
            <form onSubmit={manejarGuardar}>
              <div style={estilos.campo}>
                <label style={estilos.label}>Título del evento:</label>
                <input 
                  type="text" 
                  placeholder="Ej. Cita Médica" 
                  value={nuevoTitulo}
                  onChange={(e) => setNuevoTitulo(e.target.value)}
                  style={estilos.input} 
                />
              </div>

              <div style={estilos.campo}>
                <label style={estilos.label}>Categoría / Color:</label>
                <select 
                  value={colorSeleccionado} 
                  onChange={(e) => setColorSeleccionado(e.target.value)}
                  style={estilos.select}
                >
                  <option value="#e74c3c">🔴 Importante / Urgente</option>
                  <option value="#2980b9">🔵 Trabajo / Estudio</option>
                  <option value="#27ae60">🟢 Tiempo Libre / Festivo</option>
                  <option value="#e84393">💗 Personal / Romántico</option>
                  <option value="#9b59b6">🟣 Otros</option>
                </select>
              </div>

              <div style={estilos.botones}>
                <button type="button" onClick={() => setModalAbierta(false)} style={estilos.botonCancelar}>
                  Cancelar
                </button>
                <button type="submit" style={estilos.botonGuardar}>
                  Guardar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const estilos = {
  barraUsuario: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    padding: '10px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    color: '#2c3e50'
  },
  botonSalir: {
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 999
  },
  tarjeta: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(58, 175, 52, 0.2)',
    width: '400px', 
    boxSizing: 'border-box'
  },
  campo: {
    marginBottom: '15px',
    display: 'flex', flexDirection: 'column'
  },
  label: {
    fontWeight: 'bold', marginBottom: '5px', color: '#2c3e50', fontSize: '16px'
  },
  input: {
    padding: '10px', borderRadius: '6px', border: '1px solid #bdc3c7', fontSize: '16px'
  },
  select: {
    padding: '10px', borderRadius: '6px', border: '1px solid #bdc3c7', fontSize: '16px', backgroundColor: 'white'
  },
  botones: {
    display: 'flex', justifyContent: 'space-between', marginTop: '20px'
  },
  botonCancelar: {
    padding: '10px 20px', backgroundColor: '#c68b48', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
  },
  botonGuardar: {
    padding: '10px 20px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
  }
};

export default App;