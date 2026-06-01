const { TipoLaboratorio } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const crear = asyncHandler(async (req, res) => {
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ mensaje: 'nombre es requerido' });
  }

  const tipo = await TipoLaboratorio.create({ nombre, estado: 'activo' });
  res.status(201).json({ mensaje: 'Tipo de laboratorio creado', tipo });
});

const listar = asyncHandler(async (req, res) => {
  const { estado } = req.query;
  const where = {};
  if (estado) where.estado = estado;

  const tipos = await TipoLaboratorio.findAll({
    where,
    order: [['nombre', 'ASC']],
  });

  res.json({ total: tipos.length, tipos });
});

const actualizar = asyncHandler(async (req, res) => {
  const tipo = await TipoLaboratorio.findByPk(req.params.id);
  if (!tipo) return res.status(404).json({ mensaje: 'Tipo no encontrado' });

  const { nombre, estado } = req.body;
  if (nombre) tipo.nombre = nombre;
  if (estado) tipo.estado = estado;

  await tipo.save();
  res.json({ mensaje: 'Tipo actualizado', tipo });
});

const desactivar = asyncHandler(async (req, res) => {
  const tipo = await TipoLaboratorio.findByPk(req.params.id);
  if (!tipo) return res.status(404).json({ mensaje: 'Tipo no encontrado' });

  tipo.estado = 'inactivo';
  await tipo.save();

  res.json({ mensaje: 'Tipo desactivado', id: tipo.id });
});

module.exports = { crear, listar, actualizar, desactivar };
