const { Op } = require('sequelize');
const { Equipo, Laboratorio } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const {
  actualizarEstadoEquipo,
  marcarDisponibleTrasReparacion,
  ESTADOS,
} = require('../utils/equipoEstado');

const CATEGORIAS_VALIDAS = ['equipo', 'licencia', 'insumo'];
const ESTADOS_VALIDOS = Object.values(ESTADOS);

const registrarEquipo = asyncHandler(async (req, res) => {
  const { nombre, numero_serie, categoria, tipo, laboratorio_id, estado } = req.body;

  if (!nombre || !tipo || !laboratorio_id || !categoria) {
    return res.status(400).json({
      mensaje: 'nombre, categoria, tipo y laboratorio_id son requeridos',
      categoriasPermitidas: CATEGORIAS_VALIDAS,
    });
  }

  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    return res.status(400).json({ mensaje: 'Categoría no válida', categoriasPermitidas: CATEGORIAS_VALIDAS });
  }

  const laboratorio = await Laboratorio.findByPk(laboratorio_id);
  if (!laboratorio) return res.status(400).json({ mensaje: 'Laboratorio no válido' });

  const equipo = await Equipo.create({
    nombre,
    numero_serie: numero_serie || null,
    categoria,
    tipo,
    laboratorio_id,
    estado: estado && ESTADOS_VALIDOS.includes(estado) ? estado : ESTADOS.DISPONIBLE,
  });

  const creado = await Equipo.findByPk(equipo.id, {
    include: [{ model: Laboratorio, as: 'laboratorio' }],
  });

  res.status(201).json({ mensaje: 'Recurso registrado en inventario', equipo: creado });
});

const actualizarEstado = asyncHandler(async (req, res) => {
  const { estado } = req.body;

  if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({
      mensaje: 'Estado no válido',
      estadosPermitidos: ESTADOS_VALIDOS,
    });
  }

  const equipo = await Equipo.findByPk(req.params.id);
  if (!equipo) return res.status(404).json({ mensaje: 'Recurso no encontrado' });

  await actualizarEstadoEquipo(equipo.id, estado);
  await equipo.reload({ include: [{ model: Laboratorio, as: 'laboratorio' }] });

  res.json({ mensaje: 'Estado actualizado', equipo });
});

const reparar = asyncHandler(async (req, res) => {
  const equipo = await Equipo.findByPk(req.params.id);
  if (!equipo) return res.status(404).json({ mensaje: 'Recurso no encontrado' });

  if (equipo.estado !== ESTADOS.MANTENIMIENTO) {
    return res.status(400).json({ mensaje: 'Solo recursos en mantenimiento pueden marcarse como reparados' });
  }

  await marcarDisponibleTrasReparacion(equipo.id);
  await equipo.reload({ include: [{ model: Laboratorio, as: 'laboratorio' }] });

  res.json({ mensaje: 'Recurso reparado y disponible', equipo });
});

const consultarPorLaboratorio = asyncHandler(async (req, res) => {
  const { laboratorio_id } = req.params;
  const { estado, categoria, tipo, busqueda } = req.query;

  const laboratorio = await Laboratorio.findByPk(laboratorio_id);
  if (!laboratorio) return res.status(404).json({ mensaje: 'Laboratorio no encontrado' });

  const where = { laboratorio_id };
  if (estado) where.estado = estado;
  if (categoria) where.categoria = categoria;
  if (tipo) where.tipo = { [Op.like]: `%${tipo}%` };
  if (busqueda) {
    where[Op.or] = [
      { nombre: { [Op.like]: `%${busqueda}%` } },
      { numero_serie: { [Op.like]: `%${busqueda}%` } },
    ];
  }

  const equipos = await Equipo.findAll({
    where,
    include: [{ model: Laboratorio, as: 'laboratorio' }],
    order: [['categoria', 'ASC'], ['nombre', 'ASC']],
  });

  const resumen = {
    total: equipos.length,
    porEstado: {
      disponible: equipos.filter((e) => e.estado === 'disponible').length,
      prestado: equipos.filter((e) => e.estado === 'prestado').length,
      mantenimiento: equipos.filter((e) => e.estado === 'mantenimiento').length,
      baja: equipos.filter((e) => e.estado === 'baja').length,
    },
    porCategoria: {
      equipo: equipos.filter((e) => e.categoria === 'equipo').length,
      licencia: equipos.filter((e) => e.categoria === 'licencia').length,
      insumo: equipos.filter((e) => e.categoria === 'insumo').length,
    },
  };

  res.json({
    laboratorio: { id: laboratorio.id, nombre: laboratorio.nombre, ubicacion: laboratorio.ubicacion },
    resumen,
    total: equipos.length,
    equipos,
  });
});

const listarCategorias = asyncHandler(async (req, res) => {
  res.json({
    categorias: [
      { valor: 'equipo', etiqueta: 'Equipo' },
      { valor: 'licencia', etiqueta: 'Licencia de software' },
      { valor: 'insumo', etiqueta: 'Insumo' },
    ],
    estados: ESTADOS_VALIDOS,
  });
});

module.exports = {
  registrarEquipo,
  actualizarEstado,
  reparar,
  consultarPorLaboratorio,
  listarCategorias,
};
