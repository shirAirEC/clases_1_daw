import psycopg2

conn_string = "postgresql://postgres:kJdwaUGlxjbfdswzvSDnCbPFRBBGNBBq@interchange.proxy.rlwy.net:30719/railway"

try:
    conn = psycopg2.connect(conn_string)
    cursor = conn.cursor()
    
    # Verificar usuario
    cursor.execute("SELECT usename FROM pg_user WHERE usename = 'estudiante'")
    result = cursor.fetchone()
    
    print("Usuario estudiante:", "EXISTE" if result else "NO EXISTE")
    
    # Verificar vistas
    cursor.execute("SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public'")
    vistas = cursor.fetchone()[0]
    print(f"Vistas creadas: {vistas}")
    
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
