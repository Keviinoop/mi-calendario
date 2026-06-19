from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base  # <--- Importamos la Base desde tu database.py

# 1. Tabla de Usuarios (Para ti y tu novia)
class UsuarioDB(Base):
    __tablename__ = "usuarios"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)  # Aquí se guardará encriptada

    # Relación: Un usuario puede tener muchos eventos anotados
    eventos = relationship("EventoDB", back_populates="dueno")

# 2. Tu tabla de Eventos modificada (Cada evento ahora tiene dueño)
class EventoDB(Base):
    __tablename__ = "eventos"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    start = Column(String, nullable=False)
    color = Column(String, default="#3498db")
    
    # 🚨 LA LLAVE FORÁNEA: Conecta este evento con el ID del usuario que lo creó
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    
    # Relación inversa: Nos permite saber quién es el dueño del evento
    dueno = relationship("UsuarioDB", back_populates="eventos")