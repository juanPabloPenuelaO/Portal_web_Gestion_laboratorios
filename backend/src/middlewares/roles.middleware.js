const { ROLES, PERMISOS, tienePermiso } = require('../config/roles');

const esAdministrador = (usuario) => usuario?.rol === ROLES.ADMINISTRADOR;

/**
 * Verifica que el usuario tenga uno de los roles indicados.
 * El administrador siempre tiene acceso.
 */
const authorize = (...rolesPermitidos) => (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({ mensaje: 'No autenticado' });
  }

  if (esAdministrador(req.usuario)) {
    return next();
  }

  if (!rolesPermitidos.includes(req.usuario.rol)) {
    return res.status(403).json({
      mensaje: 'No tienes permiso para realizar esta acción',
      rolRequerido: rolesPermitidos,
      rolActual: req.usuario.rol,
    });
  }

  next();
};

/**
 * Verifica un permiso específico del módulo (ej: 'reservas.aprobar').
 * El administrador siempre tiene acceso.
 */
const authorizePermiso = (permiso) => (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({ mensaje: 'No autenticado' });
  }

  if (esAdministrador(req.usuario)) {
    return next();
  }

  if (!PERMISOS[permiso]) {
    return res.status(500).json({ mensaje: `Permiso no configurado: ${permiso}` });
  }

  if (!tienePermiso(req.usuario.rol, permiso)) {
    return res.status(403).json({
      mensaje: 'No tienes permiso para realizar esta acción',
      permisoRequerido: permiso,
      rolActual: req.usuario.rol,
    });
  }

  next();
};

module.exports = authorize;
module.exports.authorizePermiso = authorizePermiso;
module.exports.esAdministrador = esAdministrador;
