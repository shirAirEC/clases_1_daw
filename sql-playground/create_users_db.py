import psycopg2
import os
from dotenv import load_dotenv
from pathlib import Path

# Obtener directorio del script
script_dir = Path(__file__).parent

# Cargar variables de entorno desde el directorio del script
load_dotenv(script_dir / '.env')

# Conexion a la base de datos
DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    # Intentar con la URL que ya conocemos
    DATABASE_URL = 'postgresql://postgres:kJdwaUGlxjbfdswzvSDnCbPFRBBGNBBq@interchange.proxy.rlwy.net:30719/railway'
    print("Usando DATABASE_URL predeterminada")

try:
    # Conectar
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    print("Conectado a la base de datos PostgreSQL")
    print("Creando tabla de usuarios...")
    
    # Leer y ejecutar el archivo SQL
    sql_file = script_dir / 'create-users.sql'
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_script = f.read()
    
    cur.execute(sql_script)
    conn.commit()
    
    print("Tabla de usuarios creada exitosamente!")
    print("\nVerificando usuarios creados:")
    
    # Verificar usuarios
    cur.execute("SELECT username, nombre_completo, rol FROM usuarios ORDER BY rol DESC, username")
    usuarios = cur.fetchall()
    
    print(f"\nTotal de usuarios: {len(usuarios)}")
    print("\nLista de usuarios:")
    for usuario in usuarios:
        print(f"  - {usuario[0]:15} | {usuario[1]:20} | Rol: {usuario[2]}")
    
    print("\n" + "="*60)
    print("CREDENCIALES DE ACCESO:")
    print("="*60)
    print("Profesor:")
    print("  Usuario: profesor")
    print("  Password: profesor123")
    print("\nAlumnos (alumno1 a alumno30):")
    print("  Usuario: alumno1, alumno2, ..., alumno30")
    print("  Password: alumno123 (para todos)")
    print("="*60)
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
    exit(1)
