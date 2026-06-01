const { Rol } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const listar = asyncHandler(async (req, res) => {
  const roles = await Rol.findAll({ order: [['nombre', 'ASC']] });
  res.json({ total: roles.length, roles });
});

module.exports = { listar };
