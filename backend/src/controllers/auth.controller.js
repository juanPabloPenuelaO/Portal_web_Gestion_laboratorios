const jwt = require('jsonwebtoken');
const { Usuario, Rol } = require('../models');
const { DESCRIPCION_ROLES, ETIQUETAS_ROLES, obtenerPermisosDeRol, normalizarRol } = require('../config/roles');
const { esEstado } = require('../config/estados');
const asyncHandler = require('../utils/asyncHandler');

const login = asyncHandler(async (req, res) => {
  const { email, contrasena } = req.body;

  if (!email || !contrasena) {
    return res.status(400).json({ mensaje: 'Email y contraseña son requeridos' });
  }

  const usuario = await Usuario.scope('withPassword').findOne({
    where: { email },
    include: [{ model: Rol, as: 'rol' }],
  });

  if (!usuario || !esEstado(usuario.estado, 'ACTIVO')) {
    return res.status(401).json({ mensaje: 'Credenciales inválidas' });
  }

  const valida = await usuario.validarContrasena(contrasena);
  if (!valida) {
    return res.status(401).json({ mensaje: 'Credenciales inválidas' });
  }

  const rol = normalizarRol(usuario.rol.nombre);
  const permisos = obtenerPermisosDeRol(rol);

  const token = jwt.sign(
    { id: usuario.id, rol_id: usuario.rol_id, rol },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    mensaje: 'Sesión exitosa',
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol,
      etiquetaRol: ETIQUETAS_ROLES[rol] || rol,
      descripcionRol: DESCRIPCION_ROLES[rol],
      permisos,
    },
  });
});

const me = asyncHandler(async (req, res) => {
  const usuario = await Usuario.findByPk(req.usuario.id, {
    include: [{ model: Rol, as: 'rol' }],
  });

  const rol = normalizarRol(usuario.rol.nombre);

  res.json({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol,
    etiquetaRol: ETIQUETAS_ROLES[rol] || rol,
    descripcionRol: DESCRIPCION_ROLES[rol],
    permisos: obtenerPermisosDeRol(rol),
    estado: usuario.estado,
    fecha_creacion: usuario.fecha_creacion,
  });
});

module.exports = { login, me };
