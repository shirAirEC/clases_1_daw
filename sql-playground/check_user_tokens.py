import os
import psycopg2
from datetime import datetime
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("Error: DATABASE_URL no encontrada")
    exit(1)

try:
    conn = psycopg2.connect(DATABASE_URL, sslmode='require')
    cursor = conn.cursor()
    
    # Pedir el username al usuario
    username = input("Ingresa el username a verificar (por defecto 'alumnotest'): ").strip()
    if not username:
        username = 'alumnotest'
    
    print(f"\n=== Verificando usuario: {username} ===\n")
    
    # Obtener info del usuario
    cursor.execute("""
        SELECT usuario_id, username, nombre_completo, rol, email
        FROM usuarios
        WHERE username = %s
    """, (username,))
    
    user = cursor.fetchone()
    
    if not user:
        print(f"Usuario '{username}' no encontrado en la base de datos")
        exit(1)
    
    usuario_id, username, nombre, rol, email = user
    print(f"Usuario encontrado:")
    print(f"  ID: {usuario_id}")
    print(f"  Username: {username}")
    print(f"  Nombre: {nombre}")
    print(f"  Rol: {rol}")
    print(f"  Email: {email}")
    
    # Obtener tokens del usuario
    cursor.execute("""
        SELECT token, created_at, expires_at, last_used
        FROM auth_tokens
        WHERE usuario_id = %s
        ORDER BY created_at DESC
    """, (usuario_id,))
    
    tokens = cursor.fetchall()
    
    print(f"\n=== Tokens del usuario ===")
    print(f"Total de tokens: {len(tokens)}\n")
    
    if not tokens:
        print("No tiene tokens activos")
    else:
        now = datetime.now()
        for i, (token, created, expires, last_used) in enumerate(tokens, 1):
            token_short = token[:16] + '...'
            is_expired = expires < now
            status = "EXPIRADO" if is_expired else "VALIDO"
            
            print(f"Token #{i}:")
            print(f"  Token: {token_short}")
            print(f"  Creado: {created}")
            print(f"  Expira: {expires}")
            print(f"  Ultimo uso: {last_used}")
            print(f"  Estado: {status}")
            print()
    
    cursor.close()
    conn.close()
    print("Verificacion completada")
    
except Exception as e:
    print(f"Error: {e}")
