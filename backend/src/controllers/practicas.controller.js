const { Op } = require('sequelize');
const { Practica, Usuario, Laboratorio } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const {
  resumenPracticas,
  agruparPracticas,
  practicaPendiente,
  estadoPractica,
} = require('../utils/practicasHelpers');

const planear = asyncHandler(async (req, res) => {
  const { asignatura, periodo, laboratorio_id, grupo, total_planeadas } = req.body;
  const cantidad = parseInt(total_planeadas, 10) || 1;

  if (!asignatura || !periodo || !laboratorio_id || !grupo) {
    return res.status(400).json({
      mensaje: 'asignatura, periodo, laboratorio_id y grupo son requeridos',
    });
  }

  if (cantidad < 1) {
    return res.status(400).json({ mensaje: 'total_planeadas debe ser al menos 1' });
  }

  const laboratorio = await Laboratorio.findByPk(laboratorio_id);
  if (!laboratorio) return res.status(400).json({ mensaje: 'Laboratorio no válido' });

  const practica = await Practica.create({
    docente_id: req.usuario.id,
    asignatura,
    periodo,
    laboratorio_id,
    grupo,
    total_planeadas: cantidad,
    total_ejecutadas: 0,
  });

  const creada = await Practica.findByPk(practica.id, {
    include: [
      { model: Usuario, as: 'docente', attributes: ['id', 'nombre', 'email'] },
      { model: Laboratorio, as: 'laboratorio' },
    ],
  });

  res.status(201).json({ mensaje: 'Práctica planeada registrada', practica: creada });
});

const ejecutar = asyncHandler(async (req, res) => {
  const practica = await Practica.findByPk(req.params.id, {
    include: [{ model: Usuario, as: 'docente', attributes: ['id', 'nombre'] }],
  });

  if (!practica) return res.status(404).json({ mensaje: 'Práctica no encontrada' });

  if ((practica.total_ejecutadas || 0) >= (practica.total_planeadas || 0)) {
    return res.status(400).json({ mensaje: 'Todas las prácticas planeadas ya fueron ejecutadas' });
  }

  if (req.usuario.rol === 'docente' && practica.docente_id !== req.usuario.id) {
    return res.status(403).json({ mensaje: 'Solo puede ejecutar sus propias prácticas' });
  }

  const incremento = parseInt(req.body.cantidad, 10) || 1;
  const nuevoTotal = (practica.total_ejecutadas || 0) + incremento;

  if (nuevoTotal > (practica.total_planeadas || 0)) {
    return res.status(400).json({
      mensaje: `Solo puede ejecutar ${(practica.total_planeadas || 0) - (practica.total_ejecutadas || 0)} práctica(s) más`,
    });
  }

  practica.total_ejecutadas = nuevoTotal;
  await practica.save();

  const actualizada = await Practica.findByPk(practica.id, {
    include: [
      { model: Usuario, as: 'docente', attributes: ['id', 'nombre', 'email'] },
      { model: Laboratorio, as: 'laboratorio' },
    ],
  });

  res.json({ mensaje: 'Práctica marcada como ejecutada', practica: actualizada });
});

const seguimiento = asyncHandler(async (req, res) => {
  const { periodo, docente_id, asignatura } = req.query;
  const where = {};

  if (periodo) where.periodo = periodo;
  if (docente_id) where.docente_id = docente_id;
  if (asignatura) where.asignatura = { [Op.iLike]: `%${asignatura}%` };

  if (req.usuario.rol === 'docente') {
    where.docente_id = req.usuario.id;
  }

  const practicas = await Practica.findAll({
    where,
    include: [
      { model: Usuario, as: 'docente', attributes: ['id', 'nombre', 'email'] },
      { model: Laboratorio, as: 'laboratorio' },
    ],
    order: [['periodo', 'ASC'], ['asignatura', 'ASC']],
  });

  const resumen = resumenPracticas(practicas);
  const porAsignatura = agruparPracticas(practicas, 'asignatura', (p) => p.asignatura);
  const porDocente = agruparPracticas(practicas, 'docente', (p) => p.docente?.nombre || `Docente #${p.docente_id}`);

  res.json({
    resumen: {
      ...resumen,
      cancelada: 0,
    },
    comparacion: {
      porAsignatura,
      porDocente,
    },
    practicas: practicas.map((p) => ({
      ...p.toJSON(),
      estado: estadoPractica(p),
      pendientes: Math.max(0, (p.total_planeadas || 0) - (p.total_ejecutadas || 0)),
    })),
    pendientes: practicas.filter(practicaPendiente).map((p) => ({
      ...p.toJSON(),
      estado: estadoPractica(p),
    })),
  });
});

module.exports = { planear, ejecutar, seguimiento };
