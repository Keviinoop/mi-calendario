from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from seguridad import encriptar_contrasena, verificar_contrasena, crear_token_acceso

# 1. IMPORTACIONES CLAVE: Traemos la configuración y los modelos nuevos
import models
from database import engine, SessionLocal

# Reemplazamos el Base.metadata viejo por este, que lee TODOS los modelos (Usuarios y Eventos)
models.Base.metadata.create_all(bind=engine)

# 2. Inicializar FastAPI
app = FastAPI()

# 🛠️ CORRECCIÓN DE CORS: Lista extendida para evitar bloqueos del navegador en desarrollo local
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5173/",
        "http://127.0.0.1:5173/"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Esquemas para validar los datos que vienen desde React
class EventoEsquema(BaseModel):
    title: str
    start: str
    color: str = "#3498db"

# 🔑 NUEVO ESQUEMA: Para el Registro y Login
class UsuarioEsquema(BaseModel):
    username: str
    password: str

# Función auxiliar para abrir/cerrar la conexión a la BD
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==========================================
# RUTAS ACTUALES DEL CALENDARIO (ACTUALIZADAS)
# ==========================================

# 4. RUTA GET: Leer los eventos desde la Base de Datos
@app.get("/api/eventos")
def obtener_eventos(db: Session = Depends(get_db)):
    eventos = db.query(models.EventoDB).all()
    return eventos

# 5. RUTA POST: Guardar un nuevo evento en la Base de Datos
@app.post("/api/eventos")
def guardar_evento(evento: EventoEsquema, db: Session = Depends(get_db)):
    # 🚨 IMPORTANTE POR AHORA: Como aún no enlazamos el login en React,
    # le asignaremos temporalmente el usuario_id = 1 para que la BD no lance error.
    nuevo_evento = models.EventoDB(
        title=evento.title, 
        start=evento.start, 
        color=evento.color,
        usuario_id=1  # <--- Evita errores en la base de datos provisionalmente
    )
    db.add(nuevo_evento)
    db.commit() 
    db.refresh(nuevo_evento)
    return {"message": "Guardado en la Base de Datos", "evento": nuevo_evento}

# 6. RUTA DELETE: Eliminar un evento por su ID único
@app.delete("/api/eventos/{evento_id}")
def eliminar_evento(evento_id: int, db: Session = Depends(get_db)):
    evento_a_borrar = db.query(models.EventoDB).filter(models.EventoDB.id == evento_id).first()
    
    if not evento_a_borrar:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    db.delete(evento_a_borrar)
    db.commit()
    return {"message": f"Evento con ID {evento_id} eliminado con éxito"}


# ==========================================
# 🔑 RUTAS DE AUTENTICACIÓN (LOGIN Y REGISTRO)
# ==========================================

# 1. RUTA POST: Registrar un usuario nuevo
@app.post("/api/auth/register")
def registrar_usuario(usuario: UsuarioEsquema, db: Session = Depends(get_db)):
    usuario_existente = db.query(models.UsuarioDB).filter(models.UsuarioDB.username == usuario.username).first()
    if usuario_existente:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
    
    password_encriptada = encriptar_contrasena(usuario.password)
    
    nuevo_usuario = models.UsuarioDB(
        username=usuario.username,
        password=password_encriptada
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return {"message": "Usuario registrado con éxito", "username": nuevo_usuario.username}


# 2. RUTA POST: Iniciar sesión (Login)
@app.post("/api/auth/login")
def login(usuario: UsuarioEsquema, db: Session = Depends(get_db)):
    usuario_db = db.query(models.UsuarioDB).filter(models.UsuarioDB.username == usuario.username).first()
    
    if not usuario_db or not verificar_contrasena(usuario.password, usuario_db.password):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    
    token_data = {"sub": usuario_db.username, "id": usuario_db.id}
    token_acceso = crear_token_acceso(datos=token_data)
    
    return {
        "access_token": token_acceso,
        "token_type": "bearer",
        "user": {"id": usuario_db.id, "username": usuario_db.username}
    }