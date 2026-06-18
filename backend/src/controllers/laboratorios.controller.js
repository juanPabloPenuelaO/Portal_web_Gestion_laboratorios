const { Op } = require('sequelize');
const { Laboratorio, TipoLaboratorio, Reserva, Equipo, Sesion } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { ESTADOS, mapFiltroLaboratorio } = require('../config/estados');

const crear = asyncHandler(async (req, res) => {
  const { nombre, ubicacion, capacidad, tipo_id, equipamiento } = req.body;

  if (!nombre || !ubicacion || !tipo_id) {
    return res.status(400).json({ mensaje: 'nombre, ubicacion y tipo_id son requeridos' });
  }

  const tipo = await TipoLaboratorio.findByPk(tipo_id);
  if (!tipo) return res.status(400).json({ mensaje: 'Tipo de laboratorio no válido' });

  const laboratorio = await Laboratorio.create({
    nombre,
    ubicacion,
    capacidad: capacidad || 0,
    tipo_id,
    equipamiento: equipamiento || null,
    estado: ESTADOS.LABORATORIO.DISPONIBLE,
  });

  const creado = await Laboratorio.findByPk(laboratorio.id, {
    include: [{ model: TipoLaboratorio, as: 'tipo' }],
  });

  res.status(201).json({ mensaje: 'Laboratorio creado', laboratorio: creado });
});

const listar = asyncHandler(async (req, res) => {
  const { estado, tipo_id } = req.query;
  const where = {};
  if (estado) where.estado = mapFiltroLaboratorio(estado);
  if (tipo_id) where.tipo_id = tipo_id;

  const laboratorios = await Laboratorio.findAll({
    where,
    include: [
      { model: TipoLaboratorio, as: 'tipo' },
      { model: Equipo, as: 'equipos', attributes: ['id', 'nombre', 'estado', 'tipo'] },
    ],
    order: [['nombre', 'ASC']],
  });

  const resultado = laboratorios.map((lab) => {
    const json = lab.toJSON();
    json.totalEquipos = json.equipos?.length || 0;
    return json;
  });

  res.json({ total: resultado.length, laboratorios: resultado });
});

const disponibilidad = asyncHandler(async (req, res) => {
  const { fecha, hora_inicio, hora_fin } = req.query;

  if (!fecha || !hora_inicio || !hora_fin) {
    return res.status(400).json({ mensaje: 'fecha, hora_inicio y hora_fin son requeridos' });
  }

  const laboratorios = await Laboratorio.findAll({
    where: { estado: ESTADOS.LABORATORIO.DISPONIBLE },
    include: [{ model: TipoLaboratorio, as: 'tipo' }],
  });

  const reservasConflicto = await Reserva.findAll({
    where: {
      fecha,
      estado: { [Op.in]: [ESTADOS.RESERVA.PENDIENTE, ESTADOS.RESERVA.APROBADA] },
      [Op.and]: [
        { hora_inicio: { [Op.lt]: hora_fin } },
        { hora_fin: { [Op.gt]: hora_inicio } },
      ],
    },
    attributes: ['laboratorio_id', 'hora_inicio', 'hora_fin', 'asignatura'],
  });

  const sesionesConflicto = await Sesion.findAll({
    where: {
      fecha,
      estado: { [Op.in]: [ESTADOS.SESION.ACTIVA, ESTADOS.SESION.CERRADA] },
    },
    attributes: ['laboratorio_id', 'hora_apertura', 'hora_cierre'],
  });

  const sesionesSolapadas = sesionesConflicto.filter((s) => {
    const fin = s.hora_cierre || s.hora_apertura;
    return s.hora_apertura < hora_fin && fin > hora_inicio;
  });

  const ocupadosReserva = new Set(reservasConflicto.map((r) => r.laboratorio_id));
  const ocupadosSesion = new Set(sesionesSolapadas.map((s) => s.laboratorio_id));
  const ocupados = new Set([...ocupadosReserva, ...ocupadosSesion]);

  const disponibles = laboratorios.filter((lab) => !ocupados.has(lab.id));
  const noDisponibles = laboratorios.filter((lab) => ocupados.has(lab.id)).map((lab) => {
    const reservasLab = reservasConflicto.filter((r) => r.laboratorio_id === lab.id);
    const sesionesLab = sesionesSolapadas.filter((s) => s.laboratorio_id === lab.id);
    return {
      ...lab.toJSON(),
      conflictos: {
        reservas: reservasLab.length,
        sesiones: sesionesLab.length,
      },
    };
  });

  res.json({
    fecha,
    hora_inicio,
    hora_fin,
    disponibles,
    noDisponibles,
    totalDisponibles: disponibles.length,
    totalNoDisponibles: noDisponibles.length,
  });
});

const actualizar = asyncHandler(async (req, res) => {
  const laboratorio = await Laboratorio.findByPk(req.params.id);
  if (!laboratorio) return res.status(404).json({ mensaje: 'Laboratorio no encontrado' });

  const { nombre, ubicacion, capacidad, tipo_id, estado, equipamiento } = req.body;
  if (nombre) laboratorio.nombre = nombre;
  if (ubicacion) laboratorio.ubicacion = ubicacion;
  if (capacidad !== undefined) laboratorio.capacidad = capacidad;
  if (tipo_id) laboratorio.tipo_id = tipo_id;
  if (estado) laboratorio.estado = mapFiltroLaboratorio(estado);
  if (equipamiento !== undefined) laboratorio.equipamiento = equipamiento;

  await laboratorio.save();

  const actualizado = await Laboratorio.findByPk(laboratorio.id, {
    include: [{ model: TipoLaboratorio, as: 'tipo' }],
  });

  res.json({ mensaje: 'Laboratorio actualizado', laboratorio: actualizado });
});

const desactivar = asyncHandler(async (req, res) => {
  const laboratorio = await Laboratorio.findByPk(req.params.id);
  if (!laboratorio) return res.status(404).json({ mensaje: 'Laboratorio no encontrado' });

  laboratorio.estado = ESTADOS.LABORATORIO.EN_MANTENIMIENTO;
  await laboratorio.save();

  res.json({ mensaje: 'Laboratorio desactivado', id: laboratorio.id });
});

module.exports = { crear, listar, disponibilidad, actualizar, desactivar };
