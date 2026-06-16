const { Op } = require('sequelize');
const { Incidencia, Equipo, Usuario, Sesion, Laboratorio, Reserva } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { ESTADOS } = require('../config/estados');

// RF-08: Historial de incidencias por laboratorio
const historialIncidencias = asyncHandler(async (req, res) => {
  const { laboratorio_id, fecha_inicio, fecha_fin } = req.query;

  if (!laboratorio_id) {
    return res.status(400).json({ mensaje: 'laboratorio_id es requerido' });
  }

  const laboratorio = await Laboratorio.findByPk(laboratorio_id);
  if (!laboratorio) return res.status(404).json({ mensaje: 'Laboratorio no encontrado' });

  const whereIncidencia = { laboratorio_id };
  if (fecha_inicio && fecha_fin) {
    whereIncidencia.fecha = { [Op.between]: [fecha_inicio, fecha_fin] };
  }

  const incidencias = await Incidencia.findAll({
    where: whereIncidencia,
    include: [
      { model: Equipo, as: 'equipo', required: false },
      { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] },
      { model: Sesion, as: 'sesion', required: false },
      { model: Laboratorio, as: 'laboratorio' },
    ],
    order: [['fecha', 'DESC']],
  });

  res.json({
    rf: 'RF-08',
    laboratorio: { id: laboratorio.id, nombre: laboratorio.nombre },
    total: incidencias.length,
    incidencias,
  });
});

// RF-09: Agenda y sesiones programadas por laboratorio según rol
const agenda = asyncHandler(async (req, res) => {
  const { laboratorio_id, fecha_inicio, fecha_fin } = req.query;
  const rol = req.usuario.rol;

  const reservaWhere = { estado: { [Op.in]: [ESTADOS.RESERVA.PENDIENTE, ESTADOS.RESERVA.APROBADA] } };
  const sesionWhere = { estado: { [Op.in]: [ESTADOS.SESION.ACTIVA, ESTADOS.SESION.CERRADA] } };

  if (laboratorio_id) {
    reservaWhere.laboratorio_id = laboratorio_id;
    sesionWhere.laboratorio_id = laboratorio_id;
  }

  if (fecha_inicio && fecha_fin) {
    reservaWhere.fecha = { [Op.between]: [fecha_inicio, fecha_fin] };
    sesionWhere.fecha = { [Op.between]: [fecha_inicio, fecha_fin] };
  }

  if (rol === 'docente') {
    reservaWhere.docente_id = req.usuario.id;
    sesionWhere.docente_id = req.usuario.id;
  }

  if (rol === 'estudiante') {
    reservaWhere.estado = ESTADOS.RESERVA.APROBADA;
  }

  const [reservas, sesiones] = await Promise.all([
    Reserva.findAll({
      where: reservaWhere,
      include: [
        { model: Laboratorio, as: 'laboratorio' },
        { model: Usuario, as: 'docente', attributes: ['id', 'nombre'] },
      ],
      order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']],
    }),
    Sesion.findAll({
      where: sesionWhere,
      include: [
        { model: Laboratorio, as: 'laboratorio' },
        { model: Usuario, as: 'docente', attributes: ['id', 'nombre'] },
      ],
      order: [['fecha', 'ASC'], ['hora_apertura', 'ASC']],
    }),
  ]);

  const eventos = [
    ...reservas.map((r) => ({
      tipo: 'reserva',
      id: r.id,
      laboratorio: r.laboratorio?.nombre,
      laboratorio_id: r.laboratorio_id,
      fecha: r.fecha,
      hora_inicio: r.hora_inicio,
      hora_fin: r.hora_fin,
      asignatura: r.asignatura,
      grupo: r.grupo,
      docente: r.docente?.nombre,
      estado: r.estado,
    })),
    ...sesiones.map((s) => ({
      tipo: 'sesion',
      id: s.id,
      laboratorio: s.laboratorio?.nombre,
      laboratorio_id: s.laboratorio_id,
      fecha: s.fecha,
      hora_inicio: s.hora_apertura,
      hora_fin: s.hora_cierre || s.hora_apertura,
      docente: s.docente?.nombre,
      estado: s.estado,
    })),
  ].sort((a, b) => `${a.fecha}${a.hora_inicio}`.localeCompare(`${b.fecha}${b.hora_inicio}`));

  res.json({
    rf: 'RF-09',
    rol,
    filtros: { laboratorio_id, fecha_inicio, fecha_fin },
    resumen: { reservas: reservas.length, sesiones: sesiones.length, eventos: eventos.length },
    eventos,
    reservas,
    sesiones,
  });
});

module.exports = { historialIncidencias, agenda };
