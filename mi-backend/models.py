from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class UsuarioDB(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    # 🛠️ CAMBIO: Ahora usamos la ruta completa del módulo "models.EventoDB"
    eventos = relationship("models.EventoDB", back_populates="dueño")


class EventoDB(Base):
    __tablename__ = "eventos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    start = Column(String, index=True)
    color = Column(String, default="#3498db")
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    link = Column(String, nullable=True) 

    # 🛠️ CAMBIO: Ahora usamos la ruta completa del módulo "models.UsuarioDB"
    dueño = relationship("models.UsuarioDB", back_populates="eventos")