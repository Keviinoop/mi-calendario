import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

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
  const [eventos, setEventos] = useState([]);
  
  // 🚨 ESTADOS NUEVOS para controlar el formulario flotante
  const [modalAbierta, setModalAbierta] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [colorSeleccionado, setColorSeleccionado] = useState('#27ae60'); // Verde por defecto

  const cargarEventos = () => {
    fetch('http://127.0.0.1:8000/api/eventos')
      .then(response => response.json())
      .then(data => setEventos(data))
      .catch(error => console.error("Error conectando con Python:", error));
  };

  useEffect(() => {
    cargarEventos();
  }, []);

  // Al hacer clic en el día, solo guardamos la fecha y abrimos nuestra tarjeta
  const handleDateClick = (arg) => {
    setFechaSeleccionada(arg.dateStr);
    setNuevoTitulo(''); // Limpiamos el texto anterior
    setModalAbierta(true); // ¡Abrimos la tarjeta!
  };

  // Función que se ejecuta al darle "Guardar" en la tarjeta
  const manejarGuardar = (e) => {
    e.preventDefault(); // Evita que la página se recargue
    if (!nuevoTitulo.trim()) return alert("Por favor escribe un título");

    const nuevoEvento = {
      title: nuevoTitulo,
      start: fechaSeleccionada,
      color: colorSeleccionado
    };

    fetch('http://127.0.0.1:8000/api/eventos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoEvento),
    })
    .then(response => response.json())
    .then(() => {
      cargarEventos();
      setModalAbierta(false); // Cerramos la tarjeta
    })
    .catch(error => console.error("Error al guardar:", error));
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'bold, sans-serif', position: 'relative' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Mi Calendario</h1>
      <h3 style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: '20px' }}>React ⚛️ + FastAPI + Python 🐍</h3>
      
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <FullCalendar
  plugins={[dayGridPlugin, interactionPlugin]}
  initialView="dayGridMonth"
  locale="es"
  buttonText={{ today: 'Hoy' }}
headerToolbar={{
    left: 'title',               // Mueve el título ("junio de 2026") a la izquierda
    center: '',                  // Deja el centro libre
    right: 'prev,today,next'     // Pone las flechas y el botón Hoy a la derecha
  }}

  events={eventos}
  dateClick={handleDateClick}
  
  // 🚨 NUEVA PROPIEDAD: Escucha los clics sobre los eventos existentes
  eventClick={(info) => {
    // info.event.title es el nombre del evento
    // info.event.id es el número único que viene de SQLite
    const confirmar = window.confirm(`¿Estás seguro de que quieres eliminar el evento "${info.event.title}"?`);
    
    if (confirmar) {
      // Viajamos a Python pasándole el ID en la URL
      fetch(`http://127.0.0.1:8000/api/eventos/${info.event.id}`, {
        method: 'DELETE',
      })
      .then(response => response.json())
      .then(() => {
        // Volvemos a leer la base de datos para que desaparezca de la pantalla
        cargarEventos(); 
      })
      .catch(error => console.error("Error al eliminar:", error));
    }
  }}
/>
      </div>

      {/* 🚨 TARJETA FLOTANTE (MODAL CUSTOM) */}
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

// 🎨 OBJETO DE ESTILOS CSS PARA LA TARJETA
const estilos = {
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
    width: '800px',
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