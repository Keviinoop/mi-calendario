import jwt
import hashlib
import secrets
from datetime import datetime, timedelta

# Configuración secreta para tus Tokens
SECRET_KEY = "MI_CLAVE_SECRETA_SUPER_SEGURA_PARA_EL_CALENDARIO"
ALGORITHM = "HS256"

# 1. Función para encriptar usando una función nativa y segura de Python
def encriptar_contrasena(contrasena: str) -> str:
    # Creamos una "sal" (un código aleatorio para que la encriptación sea única)
    sal = secrets.token_hex(16)
    # Generamos el hash seguro
    hash_seguro = hashlib.pbkdf2_hmac('sha256', contrasena.encode('utf-8'), sal.encode('utf-8'), 100000)
    # Guardamos la sal junto al hash separados por un punto para poder verificarlo luego
    return f"{sal}.{hash_seguro.hex()}"

# 2. Función para verificar si la contraseña coincide (BLINDADA)
def verificar_contrasena(contrasena_plana: str, contrasena_encriptada: str) -> bool:
    try:
        # Si por error de una prueba vieja la contraseña en la BD no tiene el punto '.', evitamos el crash
        if '.' not in contrasena_encriptada:
            return False
            
        # Separamos la sal del hash original
        sal, hash_original = contrasena_encriptada.split('.')
        
        # Encriptamos la contraseña plana con la misma sal
        nuevo_hash = hashlib.pbkdf2_hmac('sha256', contrasena_plana.encode('utf-8'), sal.encode('utf-8'), 100000)
        
        # Comparamos usando un método seguro contra ataques de temporización (timing attacks)
        return secrets.compare_digest(nuevo_hash.hex(), hash_original)
    except Exception:
        return False

# 3. Función para crear el Token JWT
def crear_token_acceso(datos: dict) -> str:
    datos_copia = datos.copy()
    # Usamos datetime.utcnow() manteniendo tu lógica de expiración de 24 horas
    tiempo_expiracion = datetime.utcnow() + timedelta(hours=24)
    datos_copia.update({"exp": tiempo_expiracion})
    token_jwt = jwt.encode(datos_copia, SECRET_KEY, algorithm=ALGORITHM)
    return token_jwt


# 4. FUNCIÓN NUEVA: Para decodificar y validar el Token JWT de los eventos
def verificar_token_acceso(token: str) -> dict | None:
    try:
        # Decodificamos el token usando la misma clave secreta y algoritmo
        datos_decodificados = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return datos_decodificados  # Retorna el diccionario con {"sub": "usuario", "id": X, "exp": ...}
    except jwt.ExpiredSignatureError:
        # El token caducó (pasaron las 24 horas)
        return None
    except jwt.PyJWTError:
        # El token es falso, está roto o fue alterado
        return None