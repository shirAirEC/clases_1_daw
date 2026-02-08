import psycopg2
import sys

# Connection string
conn_string = "postgresql://postgres:kJdwaUGlxjbfdswzvSDnCbPFRBBGNBBq@interchange.proxy.rlwy.net:30719/railway"

try:
    # Conectar a la base de datos
    print("Conectando a la base de datos...")
    conn = psycopg2.connect(conn_string)
    conn.autocommit = True
    cursor = conn.cursor()
    
    # Leer el script SQL
    print("Leyendo script SQL...")
    with open('sql-playground/init-database.sql', 'r', encoding='utf-8') as f:
        sql_script = f.read()
    
    # Ejecutar el script
    print("Ejecutando script...")
    cursor.execute(sql_script)
    
    # Verificar que se crearon las tablas
    print("\nScript ejecutado exitosamente!")
    print("\nVerificando tablas creadas...")
    
    cursor.execute("""
        SELECT COUNT(*) FROM pelicula;
    """)
    peliculas = cursor.fetchone()[0]
    
    cursor.execute("""
        SELECT COUNT(*) FROM actor;
    """)
    actores = cursor.fetchone()[0]
    
    cursor.execute("""
        SELECT COUNT(*) FROM cliente;
    """)
    clientes = cursor.fetchone()[0]
    
    cursor.execute("""
        SELECT COUNT(*) FROM alquiler;
    """)
    alquileres = cursor.fetchone()[0]
    
    print(f"\nDatos cargados:")
    print(f"   - Peliculas: {peliculas}")
    print(f"   - Actores: {actores}")
    print(f"   - Clientes: {clientes}")
    print(f"   - Alquileres: {alquileres}")
    
    cursor.close()
    conn.close()
    
    print("\nBase de datos lista para usar!")
    
except Exception as e:
    print(f"\nError: {e}")
    sys.exit(1)
