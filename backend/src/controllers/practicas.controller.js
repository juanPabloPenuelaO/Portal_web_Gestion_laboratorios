const { Op } = require('sequelize');
const { Practica, Usuario, Laboratorio } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { fechaActual } = require('../utils/codigo');

const planear = asyncHandler(async (req, res) => {
  const { asignatura, periodo, laboratorio_id, grupo, fecha_planeada } = req.body;

  if (!asignatura || !periodo || !laboratorio_id || !grupo || !fecha_planeada) {
    return res.status(400).json({
      mensaje: 'asignatura, periodo, laboratorio_id, grupo y fecha_planeada son requeridos',
    });
  }

  const laboratorio = await Laboratorio.findByPk(laboratorio_id);
  if (!laboratorio) return res.status(400).json({ mensaje: 'Laboratorio no válido' });

  const practica = await Practica.create({
    docente_id: req.usuario.id,
    asignatura,
    periodo,
    laboratorio_id,
    grupo,
    fecha_planeada,
    estado: 'planeada',
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

  if (practica.estado === 'ejecutada') {
    return res.status(400).json({ mensaje: 'La práctica ya fue ejecutada' });
  }

  if (practica.estado === 'cancelada') {
    return res.status(400).json({ mensaje: 'No se puede ejecutar una práctica cancelada' });
  }

  if (req.usuario.rol === 'docente' && practica.docente_id !== req.usuario.id) {
    return res.status(403).json({ mensaje: 'Solo puede ejecutar sus propias prácticas' });
  }

  practica.estado = 'ejecutada';
  practica.fecha_ejecutada = req.body.fecha_ejecutada || fechaActual();
  await practica.save();

  const actualizada = await Practica.findByPk(practica.id, {
    include: [
      { model: Usuario, as: 'docente', attributes: ['id', 'nombre', 'email'] },
      { model: Laboratorio, as: 'laboratorio' },
    ],
  });

  res.json({ mensaje: 'Práctica marcada como ejecutada', practica: actualizada });
});

const agruparComparacion = (practicas, campo, etiquetaFn) => {
  const grupos = {};

  practicas.forEach((p) => {
    const clave = campo === 'docente' ? p.docente_id : p[campo];
    const etiqueta = etiquetaFn(p);

    if (!grupos[clave]) {
      grupos[clave] = {
        id: campo === 'docente' ? p.docente_id : clave,
        etiqueta,
        total: 0,
        planeadas: 0,
        ejecutadas: 0,
        canceladas: 0,
        porcentajeEjecucion: 0,
      };
    }

    grupos[clave].total += 1;
    if (p.estado === 'planeada') grupos[clave].planeadas += 1;
    if (p.estado === 'ejecutada') grupos[clave].ejecutadas += 1;
    if (p.estado === 'cancelada') grupos[clave].canceladas += 1;
  });

  return Object.values(grupos).map((g) => ({
    ...g,
    porcentajeEjecucion: g.total > 0 ? Math.round((g.ejecutadas / g.total) * 100) : 0,
  }));
};

const seguimiento = asyncHandler(async (req, res) => {
  const { periodo, docente_id, asignatura } = req.query;
  const where = {};

  if (periodo) where.periodo = periodo;
  if (docente_id) where.docente_id = docente_id;
  if (asignatura) where.asignatura = { [Op.like]: `%${asignatura}%` };

  if (req.usuario.rol === 'docente') {
    where.docente_id = req.usuario.id;
  }

  const practicas = await Practica.findAll({
    where,
    include: [
      { model: Usuario, as: 'docente', attributes: ['id', 'nombre', 'email'] },
      { model: Laboratorio, as: 'laboratorio' },
    ],
    order: [['fecha_planeada', 'ASC']],
  });

  const planeada = practicas.filter((p) => p.estado === 'planeada').length;
  const ejecutada = practicas.filter((p) => p.estado === 'ejecutada').length;
  const cancelada = practicas.filter((p) => p.estado === 'cancelada').length;
  const total = practicas.length;
  const porcentajeCumplimiento = total > 0 ? Math.round((ejecutada / total) * 100) : 0;

  const porAsignatura = agruparComparacion(practicas, 'asignatura', (p) => p.asignatura);
  const porDocente = agruparComparacion(practicas, 'docente', (p) => p.docente?.nombre || `Docente #${p.docente_id}`);

  res.json({
    resumen: {
      total,
      planeada,
      ejecutada,
      cancelada,
      porcentajeCumplimiento,
    },
    comparacion: {
      porAsignatura,
      porDocente,
    },
    practicas,
  });
});

module.exports = { planear, ejecutar, seguimiento };
