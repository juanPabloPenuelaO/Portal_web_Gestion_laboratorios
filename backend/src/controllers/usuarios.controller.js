const { Op } = require('sequelize');
const { Usuario, Rol } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const crear = asyncHandler(async (req, res) => {
  const { nombre, email, contrasena, rol_id } = req.body;

  if (!nombre || !email || !contrasena || !rol_id) {
    return res.status(400).json({ mensaje: 'nombre, email, contrasena y rol_id son requeridos' });
  }

  const rol = await Rol.findByPk(rol_id);
  if (!rol) return res.status(400).json({ mensaje: 'Rol no válido' });

  const usuario = await Usuario.create({ nombre, email, contrasena, rol_id });
  const creado = await Usuario.findByPk(usuario.id, {
    include: [{ model: Rol, as: 'rol' }],
  });

  res.status(201).json({ mensaje: 'Usuario creado', usuario: creado });
});

const listar = asyncHandler(async (req, res) => {
  const { rol, estado, busqueda } = req.query;
  const where = {};

  if (estado) where.estado = estado;
  if (busqueda) {
    where[Op.or] = [
      { nombre: { [Op.like]: `%${busqueda}%` } },
      { email: { [Op.like]: `%${busqueda}%` } },
    ];
  }

  const include = [{ model: Rol, as: 'rol' }];
  if (rol) include[0].where = { nombre: rol };

  const usuarios = await Usuario.findAll({ where, include, order: [['nombre', 'ASC']] });
  res.json({ total: usuarios.length, usuarios });
});

const actualizar = asyncHandler(async (req, res) => {
  const usuario = await Usuario.findByPk(req.params.id);
  if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

  const { nombre, email, rol_id, contrasena } = req.body;
  if (nombre) usuario.nombre = nombre;
  if (email) usuario.email = email;
  if (rol_id) usuario.rol_id = rol_id;
  if (contrasena) usuario.contrasena = contrasena;

  await usuario.save();

  const actualizado = await Usuario.findByPk(usuario.id, {
    include: [{ model: Rol, as: 'rol' }],
  });

  res.json({ mensaje: 'Usuario actualizado', usuario: actualizado });
});

const desactivar = asyncHandler(async (req, res) => {
  const usuario = await Usuario.findByPk(req.params.id);
  if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

  usuario.estado = 'inactivo';
  await usuario.save();

  res.json({ mensaje: 'Usuario desactivado', id: usuario.id });
});

module.exports = { crear, listar, actualizar, desactivar };
