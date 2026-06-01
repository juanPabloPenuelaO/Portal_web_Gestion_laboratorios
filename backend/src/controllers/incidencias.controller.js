const { Incidencia, Equipo, Usuario, Sesion, Laboratorio } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { marcarMantenimientoPorIncidencia } = require('../utils/equipoEstado');

const reportar = asyncHandler(async (req, res) => {
  const { equipo_id, sesion_id, tipo_falla, descripcion, foto_url } = req.body;

  if (!tipo_falla || !descripcion) {
    return res.status(400).json({ mensaje: 'tipo_falla y descripcion son requeridos' });
  }

  if (equipo_id) {
    const equipo = await Equipo.findByPk(equipo_id);
    if (!equipo) return res.status(400).json({ mensaje: 'Equipo no válido' });
  }

  if (sesion_id) {
    const sesion = await Sesion.findByPk(sesion_id);
    if (!sesion) return res.status(400).json({ mensaje: 'Sesión no válida' });
  }

  const incidencia = await Incidencia.create({
    equipo_id: equipo_id || null,
    usuario_id: req.usuario.id,
    sesion_id: sesion_id || null,
    tipo_falla,
    descripcion,
    foto_url: foto_url || null,
    fecha: new Date(),
  });

  if (equipo_id) {
    await marcarMantenimientoPorIncidencia(equipo_id);
  }

  const creada = await Incidencia.findByPk(incidencia.id, {
    include: [
      { model: Equipo, as: 'equipo' },
      { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] },
      { model: Sesion, as: 'sesion' },
    ],
  });

  res.status(201).json({
    mensaje: equipo_id
      ? 'Incidencia reportada. Estado del recurso actualizado a mantenimiento.'
      : 'Incidencia reportada',
    incidencia: creada,
  });
});

const listar = asyncHandler(async (req, res) => {
  const { laboratorio_id, equipo_id } = req.query;

  const include = [
    { model: Equipo, as: 'equipo', include: [{ model: Laboratorio, as: 'laboratorio' }] },
    { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] },
    { model: Sesion, as: 'sesion' },
  ];

  const where = {};
  if (equipo_id) where.equipo_id = equipo_id;

  let incidencias = await Incidencia.findAll({
    where,
    include,
    order: [['fecha', 'DESC']],
  });

  if (laboratorio_id) {
    incidencias = incidencias.filter(
      (i) => i.equipo && i.equipo.laboratorio_id === parseInt(laboratorio_id, 10)
    );
  }

  res.json({ total: incidencias.length, incidencias });
});

module.exports = { reportar, listar };
