const jwt = require('jsonwebtoken');
const { Usuario, Rol } = require('../models');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await Usuario.findByPk(decoded.id, {
      include: [{ model: Rol, as: 'rol' }],
    });

    if (!usuario || usuario.estado !== 'activo') {
      return res.status(401).json({ mensaje: 'Usuario no válido o inactivo' });
    }

    req.usuario = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol_id: usuario.rol_id,
      rol: usuario.rol.nombre,
    };

    next();
  } catch {
    return res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
};

module.exports = auth;
