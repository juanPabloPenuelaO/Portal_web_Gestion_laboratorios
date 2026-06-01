const ROLES = {
  ADMINISTRADOR: 'administrador',
  DIRECTOR_PROGRAMA: 'director_programa',
  COORDINADOR: 'coordinador',
  DOCENTE: 'docente',
  AUXILIAR: 'auxiliar',
  ESTUDIANTE: 'estudiante',
};

/**
 * Matriz de permisos por módulo.
 * administrador tiene acceso total vía middleware (bypass).
 */
const PERMISOS = {
  // Roles — consulta para formularios
  'roles.listar': [ROLES.ADMINISTRADOR],

  // Usuarios — parametrización administrador (RF-18)
  'usuarios.crear': [ROLES.ADMINISTRADOR],
  'usuarios.listar': [ROLES.ADMINISTRADOR, ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA],
  'usuarios.actualizar': [ROLES.ADMINISTRADOR],
  'usuarios.desactivar': [ROLES.ADMINISTRADOR],

  // Tipos de laboratorio — parametrización administrador (RF-16)
  'tiposLaboratorio.crear': [ROLES.ADMINISTRADOR],
  'tiposLaboratorio.listar': [ROLES.ADMINISTRADOR, ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA, ROLES.DOCENTE],
  'tiposLaboratorio.actualizar': [ROLES.ADMINISTRADOR],
  'tiposLaboratorio.desactivar': [ROLES.ADMINISTRADOR],

  // Laboratorios — parametrización administrador (RF-17)
  'laboratorios.crear': [ROLES.ADMINISTRADOR],
  'laboratorios.listar': [ROLES.ADMINISTRADOR, ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA, ROLES.DOCENTE, ROLES.AUXILIAR, ROLES.ESTUDIANTE],
  'laboratorios.disponibilidad': [ROLES.ADMINISTRADOR, ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA, ROLES.DOCENTE, ROLES.AUXILIAR, ROLES.ESTUDIANTE],
  'laboratorios.actualizar': [ROLES.ADMINISTRADOR],
  'laboratorios.desactivar': [ROLES.ADMINISTRADOR],

  // Sesiones
  'sesiones.abrir': [ROLES.DOCENTE, ROLES.AUXILIAR],
  'sesiones.cerrar': [ROLES.DOCENTE, ROLES.AUXILIAR],
  'sesiones.consultarActiva': [ROLES.ADMINISTRADOR, ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA, ROLES.DOCENTE, ROLES.AUXILIAR, ROLES.ESTUDIANTE],

  // Asistencias
  'asistencias.registrarQR': [ROLES.ESTUDIANTE],
  'asistencias.registrarCodigo': [ROLES.ESTUDIANTE],
  'asistencias.generarCodigo': [ROLES.DOCENTE, ROLES.AUXILIAR],
  'asistencias.listar': [ROLES.DOCENTE, ROLES.AUXILIAR, ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA],

  // Reservas
  'reservas.solicitar': [ROLES.DOCENTE],
  'reservas.aprobar': [ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA],
  'reservas.rechazar': [ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA],
  'reservas.cancelar': [ROLES.DOCENTE, ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA],
  'reservas.calendario': [ROLES.ADMINISTRADOR, ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA, ROLES.DOCENTE, ROLES.AUXILIAR, ROLES.ESTUDIANTE],

  // Inventario — RF-23 auxiliar/admin; RF-25 consulta coordinador/auxiliar
  'inventario.registrar': [ROLES.AUXILIAR],
  'inventario.actualizarEstado': [ROLES.AUXILIAR],
  'inventario.consultar': [ROLES.COORDINADOR, ROLES.AUXILIAR, ROLES.DIRECTOR_PROGRAMA],

  // Préstamos
  'prestamos.solicitar': [ROLES.DOCENTE, ROLES.AUXILIAR],
  'prestamos.devolver': [ROLES.DOCENTE, ROLES.AUXILIAR],

  // Incidencias
  'incidencias.reportar': [ROLES.DOCENTE, ROLES.AUXILIAR, ROLES.ESTUDIANTE],
  'incidencias.listar': [ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA, ROLES.AUXILIAR],

  // Prácticas
  'practicas.planear': [ROLES.DOCENTE],
  'practicas.ejecutar': [ROLES.DOCENTE],
  'practicas.seguimiento': [ROLES.DOCENTE, ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA],

  // Consultas portal web RF-08, RF-09
  'consultas.incidenciasHistorial': [ROLES.AUXILIAR, ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA],
  'consultas.agenda': [ROLES.ADMINISTRADOR, ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA, ROLES.DOCENTE, ROLES.AUXILIAR, ROLES.ESTUDIANTE],

  // Gobernanza RF-44 — visible para todos los autenticados
  'gobernanza.politicas': [ROLES.ADMINISTRADOR, ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA, ROLES.DOCENTE, ROLES.AUXILIAR, ROLES.ESTUDIANTE],

  // Analítica / Dashboards RF-35 a RF-43
  'analitica.dashboard': [ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA],
  'analitica.ocupacion': [ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA],
  'analitica.ausentismo': [ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA],
  'analitica.inventarioCritico': [ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA],
  'analitica.cumplimientoPracticas': [ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA],
  'analitica.subutilizados': [ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA],
  'analitica.patronesCancelacion': [ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA],
  'analitica.equiposIncidencias': [ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA],
  'analitica.comparativoCarreras': [ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA],
  'analitica.indicadoresDocente': [ROLES.COORDINADOR, ROLES.DIRECTOR_PROGRAMA],
};

const DESCRIPCION_ROLES = {
  [ROLES.ADMINISTRADOR]: 'Acceso total: gestión de usuarios y parametrización',
  [ROLES.DIRECTOR_PROGRAMA]: 'Supervisión académica, reservas y dashboards analíticos',
  [ROLES.COORDINADOR]: 'Aprobación de reservas, dashboards analíticos y seguimiento',
  [ROLES.DOCENTE]: 'Sesiones, reservas, préstamos, prácticas y asistencia',
  [ROLES.AUXILIAR]: 'Sesiones, inventario, préstamos e incidencias',
  [ROLES.ESTUDIANTE]: 'Asistencia, consulta de agenda y reporte de incidencias',
};

const ETIQUETAS_ROLES = {
  [ROLES.ADMINISTRADOR]: 'Administrador',
  [ROLES.DIRECTOR_PROGRAMA]: 'Director de programa',
  [ROLES.COORDINADOR]: 'Coordinador',
  [ROLES.DOCENTE]: 'Docente',
  [ROLES.AUXILIAR]: 'Auxiliar',
  [ROLES.ESTUDIANTE]: 'Estudiante',
};

const obtenerPermisosDeRol = (rol) => {
  if (rol === ROLES.ADMINISTRADOR) {
    return Object.keys(PERMISOS);
  }

  return Object.entries(PERMISOS)
    .filter(([, roles]) => roles.includes(rol))
    .map(([permiso]) => permiso);
};

const tienePermiso = (rol, permiso) => {
  if (rol === ROLES.ADMINISTRADOR) return true;
  const rolesPermitidos = PERMISOS[permiso];
  return rolesPermitidos ? rolesPermitidos.includes(rol) : false;
};

module.exports = {
  ROLES,
  PERMISOS,
  DESCRIPCION_ROLES,
  ETIQUETAS_ROLES,
  obtenerPermisosDeRol,
  tienePermiso,
};
