import bcrypt

# Generar hash de contraseñas
profesor_password = "Isabel7@"
alumno_password = "alumno123"

# Generar hashes
profesor_hash = bcrypt.hashpw(profesor_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
alumno_hash = bcrypt.hashpw(alumno_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

print("Contraseñas hasheadas:")
print(f"\nProfesor (Isabel7@): {profesor_hash}")
print(f"\nAlumno (alumno123): {alumno_hash}")
