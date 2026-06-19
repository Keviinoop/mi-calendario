from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# El archivo de tu base de datos local
SQLALCHEMY_DATABASE_URL = "sqlite:///./calendario.db"

# Creamos el motor de conexión
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Creamos la fábrica de sesiones (para hacer consultas)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# La Base que heredarán todas nuestras tablas
Base = declarative_base()