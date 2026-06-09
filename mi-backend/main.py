from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# 1. Configuración de la Base de Datos SQLite
DATABASE_URL = "sqlite:///./calendario.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 2. Modelo de la Tabla en la Base de Datos
class EventoDB(Base):
    __tablename__ = "eventos"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    start = Column(String)
    color = Column(String)

# Creamos el archivo de la base de datos y la tabla si no existen
Base.metadata.create_all(bind=engine)

# 3. Inicializar FastAPI
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Esquema para validar los datos que vienen desde React
class EventoEsquema(BaseModel):
    title: str
    start: str
    color: str = "#3498db"

# Función auxiliar para abrir/cerrar la conexión a la BD en cada petición
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 4. RUTA GET: Leer los eventos desde la Base de Datos
@app.get("/api/eventos")
def obtener_eventos(db: Session = Depends(get_db)):
    eventos = db.query(EventoDB).all()
    return eventos

# 5. RUTA POST: Guardar un nuevo evento en la Base de Datos
@app.post("/api/eventos")
def guardar_evento(evento: EventoEsquema, db: Session = Depends(get_db)):
    nuevo_evento = EventoDB(title=evento.title, start=evento.start, color=evento.color)
    db.add(nuevo_evento)
    db.commit() # Guarda los cambios permanentemente en el archivo .db
    db.refresh(nuevo_evento)
    return {"message": "Guardado en la Base de Datos", "evento": nuevo_evento}

# 6. RUTA DELETE: Eliminar un evento por su ID único
@app.delete("/api/eventos/{evento_id}")
def eliminar_evento(evento_id: int, db: Session = Depends(get_db)):
    # Buscamos el evento en la base de datos usando el ID
    evento_a_borrar = db.query(EventoDB).filter(EventoDB.id == evento_id).first()
    
    # Si no existe, avisamos
    if not evento_a_borrar:
        return {"error": "Evento no encontrado"}
    
    # Si existe, lo sacamos de la base de datos y guardamos los cambios
    db.delete(evento_a_borrar)
    db.commit()
    
    return {"message": f"Evento con ID {evento_id} eliminado con éxito"}