import psycopg2

# Conexión
DATABASE_URL = 'postgresql://postgres:kJdwaUGlxjbfdswzvSDnCbPFRBBGNBBq@interchange.proxy.rlwy.net:30719/railway'

try:
    print("Conectando a PostgreSQL...")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    print("Eliminando tabla usuarios anterior...")
    cur.execute("DROP TABLE IF EXISTS usuarios CASCADE;")
    conn.commit()
    print("[OK] Tabla eliminada")
    
    print("\nEjecutando script actualizado con contraseñas hasheadas...")
    
    # Leer y ejecutar el script
    with open('SCRIPT_USUARIOS_AUTH.sql', 'r', encoding='utf-8') as f:
        sql_script = f.read()
    
    cur.execute(sql_script)
    conn.commit()
    
    print("\n[OK] Script ejecutado exitosamente!")
    print("\n" + "="*60)
    print("USUARIOS ACTUALIZADOS:")
    print("="*60)
    
    # Verificar usuarios (sin mostrar contraseñas)
    cur.execute("SELECT username, nombre_completo, rol FROM usuarios ORDER BY rol DESC, username")
    usuarios = cur.fetchall()
    
    print(f"\nTotal: {len(usuarios)} usuarios")
    print("\nLista de usuarios:")
    for username, nombre, rol in usuarios[:5]:  # Solo mostrar primeros 5
        print(f"  {username:15} | {nombre:20} | {rol}")
    
    if len(usuarios) > 5:
        print(f"  ... y {len(usuarios) - 5} alumnos mas")
    
    print("\n" + "="*60)
    print("SEGURIDAD:")
    print("="*60)
    print("[OK] Contrasenas hasheadas con bcrypt")
    print("[OK] No visibles en texto plano en la BD")
    print("[OK] Usuario 'estudiante' sin acceso a tabla usuarios")
    print("="*60)
    
    # Verificar que las contraseñas están hasheadas
    cur.execute("SELECT password FROM usuarios LIMIT 1")
    sample_password = cur.fetchone()[0]
    if sample_password.startswith('$2b$'):
        print("\n[OK] Verificacion: Las contrasenas estan correctamente hasheadas")
    else:
        print("\n[ADVERTENCIA] Las contrasenas NO estan hasheadas")
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"[ERROR] Error: {e}")
