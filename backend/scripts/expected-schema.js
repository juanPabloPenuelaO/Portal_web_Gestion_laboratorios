'use strict';

const ESQUEMA_ESPERADO = {
  roles: ['id', 'nombre'],
  usuarios: ['id', 'contrasena', 'created_at', 'email', 'estado', 'fecha_creacion', 'nombre', 'updated_at', 'rol_id', 'remember_token'],
  tipos_laboratorio: ['id', 'estado', 'nombre'],
  laboratorios: ['id', 'capacidad', 'estado', 'nombre', 'ubicacion', 'tipo_id', 'equipamiento'],
  reservas: ['id', 'asignatura', 'estado', 'fecha', 'grupo', 'hora_fin', 'hora_inicio', 'observaciones', 'docente_id', 'laboratorio_id'],
  equipos: ['id', 'categoria', 'estado', 'nombre', 'numero_serie', 'tipo', 'laboratorio_id'],
  sesiones: ['id', 'estado', 'fecha', 'hora_apertura', 'hora_cierre', 'docente_id', 'laboratorio_id', 'observaciones_apertura', 'observaciones_cierre'],
  asistencias: ['id', 'metodo', 'timestamp', 'estudiante_id', 'sesion_id'],
  prestamos: ['id', 'estado', 'fecha_devolucion', 'fecha_prestamo', 'equipo_id', 'sesion_id', 'usuario_id'],
  incidencias: ['id', 'descripcion', 'fecha', 'foto_url', 'tipo_falla', 'equipo_id', 'sesion_id', 'usuario_id', 'estado', 'equipo_nombre', 'tiene_evidencia', 'laboratorio_id'],
  practicas: ['id', 'asignatura', 'grupo', 'docente_id', 'laboratorio_id', 'periodo', 'total_planeadas', 'total_ejecutadas', 'created_at', 'updated_at'],
};

console.log(JSON.stringify(ESQUEMA_ESPERADO, null, 2));
