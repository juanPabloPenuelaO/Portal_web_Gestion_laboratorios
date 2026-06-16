const { Op } = require('sequelize');
const { Reserva, Laboratorio, Usuario } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { ESTADOS, esEstado } = require('../config/estados');
const {
  notificarSolicitudReserva,
  notificarAprobacionReserva,
  notificarRechazoReserva,
  notificarCancelacionReserva,
} = require('../utils/notificaciones');

const solicitar = asyncHandler(async (req, res) => {
  const { laboratorio_id, fecha, hora_inicio, hora_fin, asignatura, grupo, observaciones } = req.body;

  if (!laboratorio_id || !fecha || !hora_inicio || !hora_fin || !asignatura || !grupo) {
    return res.status(400).json({
      mensaje: 'laboratorio_id, fecha, hora_inicio, hora_fin, asignatura y grupo son requeridos',
    });
  }

  if (hora_fin <= hora_inicio) {
    return res.status(400).json({ mensaje: 'La hora de fin debe ser posterior a la hora de inicio' });
  }

  const conflicto = await Reserva.findOne({
    where: {
      laboratorio_id,
      fecha,
      estado: { [Op.in]: [ESTADOS.RESERVA.PENDIENTE, ESTADOS.RESERVA.APROBADA] },
      [Op.and]: [
        { hora_inicio: { [Op.lt]: hora_fin } },
        { hora_fin: { [Op.gt]: hora_inicio } },
      ],
    },
  });

  if (conflicto) {
    return res.status(409).json({ mensaje: 'El laboratorio ya tiene una reserva activa en ese horario' });
  }

  const reserva = await Reserva.create({
    laboratorio_id,
    docente_id: req.usuario.id,
    fecha,
    hora_inicio,
    hora_fin,
    asignatura,
    grupo,
    observaciones,
    estado: ESTADOS.RESERVA.PENDIENTE,
  });

  const creada = await Reserva.findByPk(reserva.id, {
    include: [
      { model: Laboratorio, as: 'laboratorio' },
      { model: Usuario, as: 'docente', attributes: ['id', 'nombre', 'email'] },
    ],
  });

  await notificarSolicitudReserva(creada);

  res.status(201).json({ mensaje: 'Reserva solicitada. Se notificó al coordinador.', reserva: creada });
});

const aprobar = asyncHandler(async (req, res) => {
  const reserva = await Reserva.findByPk(req.params.id, {
    include: [
      { model: Laboratorio, as: 'laboratorio' },
      { model: Usuario, as: 'docente', attributes: ['id', 'nombre', 'email'] },
    ],
  });

  if (!reserva) return res.status(404).json({ mensaje: 'Reserva no encontrada' });

  if (!esEstado(reserva.estado, ESTADOS.RESERVA.PENDIENTE)) {
    return res.status(400).json({ mensaje: 'Solo se pueden aprobar reservas pendientes' });
  }

  const { observaciones } = req.body;

  reserva.estado = ESTADOS.RESERVA.APROBADA;
  if (observaciones) reserva.observaciones = observaciones;
  await reserva.save();

  await notificarAprobacionReserva(reserva, observaciones);

  res.json({ mensaje: 'Reserva aprobada. Se notificó al docente.', reserva });
});

const rechazar = asyncHandler(async (req, res) => {
  const reserva = await Reserva.findByPk(req.params.id, {
    include: [
      { model: Laboratorio, as: 'laboratorio' },
      { model: Usuario, as: 'docente', attributes: ['id', 'nombre', 'email'] },
    ],
  });

  if (!reserva) return res.status(404).json({ mensaje: 'Reserva no encontrada' });

  if (!esEstado(reserva.estado, ESTADOS.RESERVA.PENDIENTE)) {
    return res.status(400).json({ mensaje: 'Solo se pueden rechazar reservas pendientes' });
  }

  const { observaciones } = req.body;
  if (!observaciones) {
    return res.status(400).json({ mensaje: 'Las observaciones son requeridas al rechazar una reserva' });
  }

  reserva.estado = ESTADOS.RESERVA.RECHAZADA;
  reserva.observaciones = observaciones;
  await reserva.save();

  await notificarRechazoReserva(reserva, observaciones);

  res.json({ mensaje: 'Reserva rechazada. Se notificó al docente.', reserva });
});

const cancelar = asyncHandler(async (req, res) => {
  const reserva = await Reserva.findByPk(req.params.id, {
    include: [
      { model: Laboratorio, as: 'laboratorio' },
      { model: Usuario, as: 'docente', attributes: ['id', 'nombre', 'email'] },
    ],
  });

  if (!reserva) return res.status(404).json({ mensaje: 'Reserva no encontrada' });

  if (esEstado(reserva.estado, ESTADOS.RESERVA.CANCELADA)) {
    return res.status(400).json({ mensaje: 'La reserva ya está cancelada' });
  }

  if (esEstado(reserva.estado, ESTADOS.RESERVA.RECHAZADA)) {
    return res.status(400).json({ mensaje: 'No se puede cancelar una reserva rechazada' });
  }

  const esDocente = req.usuario.rol === 'docente' && reserva.docente_id === req.usuario.id;
  const esCoordinador = ['coordinador', 'director_programa'].includes(req.usuario.rol);
  const esAdmin = req.usuario.rol === 'administrador';

  if (!esDocente && !esCoordinador && !esAdmin) {
    return res.status(403).json({ mensaje: 'No tienes permiso para cancelar esta reserva' });
  }

  if (esDocente && !esEstado(reserva.estado, ESTADOS.RESERVA.APROBADA) && !esEstado(reserva.estado, ESTADOS.RESERVA.PENDIENTE)) {
    return res.status(400).json({ mensaje: 'Solo puede cancelar reservas pendientes o aprobadas propias' });
  }

  if ((esCoordinador || esAdmin) && !esEstado(reserva.estado, ESTADOS.RESERVA.APROBADA) && !esEstado(reserva.estado, ESTADOS.RESERVA.PENDIENTE)) {
    return res.status(400).json({ mensaje: 'Solo se pueden cancelar reservas pendientes o aprobadas' });
  }

  const motivo = req.body.motivo || req.body.observaciones;
  if (esEstado(reserva.estado, ESTADOS.RESERVA.APROBADA) && !motivo) {
    return res.status(400).json({ mensaje: 'El motivo de cancelación es requerido para reservas aprobadas' });
  }

  reserva.estado = ESTADOS.RESERVA.CANCELADA;
  if (motivo) {
    reserva.observaciones = `[Cancelada] ${motivo}${reserva.observaciones ? ` | ${reserva.observaciones}` : ''}`;
  }
  await reserva.save();

  await notificarCancelacionReserva(reserva, req.usuario, motivo);

  res.json({ mensaje: 'Reserva cancelada. Se notificó a los involucrados.', reserva });
});

const calendario = asyncHandler(async (req, res) => {
  const {
    laboratorio_id,
    docente_id,
    asignatura,
    programa,
    grupo,
    fecha_inicio,
    fecha_fin,
    estado,
    activas,
  } = req.query;

  const where = {};

  if (laboratorio_id) where.laboratorio_id = laboratorio_id;
  if (docente_id) where.docente_id = docente_id;
  if (grupo) where.grupo = { [Op.like]: `%${grupo}%` };

  const filtroPrograma = programa || asignatura;
  if (filtroPrograma) where.asignatura = { [Op.like]: `%${filtroPrograma}%` };

  if (estado) {
    where.estado = estado;
  } else if (activas !== 'false') {
    where.estado = { [Op.in]: [ESTADOS.RESERVA.PENDIENTE, ESTADOS.RESERVA.APROBADA] };
  }

  if (fecha_inicio && fecha_fin) {
    where.fecha = { [Op.between]: [fecha_inicio, fecha_fin] };
  } else if (fecha_inicio) {
    where.fecha = { [Op.gte]: fecha_inicio };
  }

  const reservas = await Reserva.findAll({
    where,
    include: [
      { model: Laboratorio, as: 'laboratorio' },
      { model: Usuario, as: 'docente', attributes: ['id', 'nombre', 'email'] },
    ],
    order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']],
  });

  res.json({ total: reservas.length, reservas });
});

module.exports = { solicitar, aprobar, rechazar, cancelar, calendario };
