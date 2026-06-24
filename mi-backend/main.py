from fastapi import FastAPI, Depends, HTTPException, status, Header
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
    link: str = "" # Propiedad opcional para guardar links universitarios

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

# ⚙️ FUNCIÓN DE SEGURIDAD: Extrae el ID del usuario directamente desde el Token JWT de React
def obtener_usuario_actual(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="No se proporcionó token de autenticación")
    
    try:
        # React enviará el token como "Bearer <tu_token>"
        token = authorization.split(" ")[1]
        
        # Leemos la función desde seguridad.py
        from seguridad import verificar_token_acceso
        datos_token = verificar_token_acceso(token) 
        
        if datos_token is None:
            raise HTTPException(status_code=401, detail="Token inválido o expirado")
            
        return datos_token # Retorna los datos del usuario (contiene el "id" y el "sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Error al validar las credenciales")


# ==========================================
# RUTAS DEL CALENDARIO 100% PRIVADAS 🔒
# ==========================================

# 4. RUTA GET: Leer ÚNICAMENTE los eventos del usuario que inició sesión
@app.get("/api/eventos")
def obtener_eventos(db: Session = Depends(get_db), usuario_actual: dict = Depends(obtener_usuario_actual)):
    # 🔒 FILTRADO: Busca únicamente los eventos asignados al ID del usuario logueado
    eventos = db.query(models.EventoDB).filter(models.EventoDB.usuario_id == usuario_actual["id"]).all()
    return eventos

# 5. RUTA POST: Guardar un nuevo evento amarrado al usuario real
@app.post("/api/eventos")
def guardar_evento(evento: EventoEsquema, db: Session = Depends(get_db), usuario_actual: dict = Depends(obtener_usuario_actual)):
    nuevo_evento = models.EventoDB(
        title=evento.title, 
        start=evento.start, 
        color=evento.color,
        usuario_id=usuario_actual["id"],
        link=evento.link  # 🔗 Guardamos el link en la base de datos
    )
    db.add(nuevo_evento)
    db.commit() 
    db.refresh(nuevo_evento)
    return {"message": "Guardado exitosamente de forma privada", "evento": nuevo_evento}

# 6. RUTA DELETE: Eliminar un evento verificando que sea de su dueño
@app.delete("/api/eventos/{evento_id}")
def eliminar_evento(evento_id: int, db: Session = Depends(get_db), usuario_actual: dict = Depends(obtener_usuario_actual)):
    # Buscamos el evento asegurándonos que pertenezca al usuario activo
    evento_a_borrar = db.query(models.EventoDB).filter(
        models.EventoDB.id == evento_id, 
        models.EventoDB.usuario_id == usuario_actual["id"]
    ).first()
    
    if not evento_a_borrar:
        raise HTTPException(status_code=404, detail="Evento no encontrado o no tienes permiso para borrarlo")
    
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
        hashed_password=password_encriptada
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return {"message": "Usuario registrado con éxito", "username": nuevo_usuario.username}


# 2. RUTA POST: Iniciar sesión (Login)
@app.post("/api/auth/login")
def login(usuario: UsuarioEsquema, db: Session = Depends(get_db)):
    usuario_db = db.query(models.UsuarioDB).filter(models.UsuarioDB.username == usuario.username).first()
    
    # Comprobación segura usando la contraseña encriptada de la base de datos
    if not usuario_db or not verificar_contrasena(usuario.password, usuario_db.hashed_password):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    
    token_data = {"sub": usuario_db.username, "id": usuario_db.id}
    token_acceso = crear_token_acceso(datos=token_data)
    
    return {
        "access_token": token_acceso,
        "token_type": "bearer",
        "user": {"id": usuario_db.id, "username": usuario_db.username}
    }