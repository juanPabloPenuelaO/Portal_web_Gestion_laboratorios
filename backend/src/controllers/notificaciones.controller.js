const { Notificacion, Reserva, Laboratorio } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const listar = asyncHandler(async (req, res) => {
  const { solo_no_leidas } = req.query;
  const where = { usuario_id: req.usuario.id };
  if (solo_no_leidas === 'true') where.leida = false;

  const notificaciones = await Notificacion.findAll({
    where,
    include: [
      {
        model: Reserva,
        as: 'reserva',
        include: [{ model: Laboratorio, as: 'laboratorio' }],
      },
    ],
    order: [['created_at', 'DESC']],
    limit: 50,
  });

  const noLeidas = await Notificacion.count({
    where: { usuario_id: req.usuario.id, leida: false },
  });

  res.json({ total: notificaciones.length, noLeidas, notificaciones });
});

const marcarLeida = asyncHandler(async (req, res) => {
  const notificacion = await Notificacion.findOne({
    where: { id: req.params.id, usuario_id: req.usuario.id },
  });

  if (!notificacion) return res.status(404).json({ mensaje: 'Notificación no encontrada' });

  notificacion.leida = true;
  await notificacion.save();

  res.json({ mensaje: 'Notificación marcada como leída', notificacion });
});

const marcarTodasLeidas = asyncHandler(async (req, res) => {
  await Notificacion.update(
    { leida: true },
    { where: { usuario_id: req.usuario.id, leida: false } }
  );

  res.json({ mensaje: 'Todas las notificaciones marcadas como leídas' });
});

module.exports = { listar, marcarLeida, marcarTodasLeidas };
