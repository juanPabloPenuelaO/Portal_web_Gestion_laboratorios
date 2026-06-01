const { Equipo, Incidencia, Prestamo } = require('../models');

const ESTADOS = {
  DISPONIBLE: 'disponible',
  PRESTADO: 'prestado',
  MANTENIMIENTO: 'mantenimiento',
  BAJA: 'baja',
};

async function actualizarEstadoEquipo(equipoId, nuevoEstado, { transaction } = {}) {
  const equipo = await Equipo.findByPk(equipoId, { transaction });
  if (!equipo) return null;

  if (equipo.estado === ESTADOS.BAJA && nuevoEstado !== ESTADOS.BAJA) {
    return equipo;
  }

  equipo.estado = nuevoEstado;
  await equipo.save({ transaction });
  return equipo;
}

/** RF-24: préstamo registrado → prestado */
async function marcarPrestado(equipoId, transaction) {
  return actualizarEstadoEquipo(equipoId, ESTADOS.PRESTADO, { transaction });
}

/** RF-24: devolución → disponible (solo si sigue en prestado) */
async function marcarDisponiblePorDevolucion(equipoId, transaction) {
  const equipo = await Equipo.findByPk(equipoId, { transaction });
  if (!equipo) return null;

  if (equipo.estado === ESTADOS.PRESTADO) {
    equipo.estado = ESTADOS.DISPONIBLE;
    await equipo.save({ transaction });
  }

  return equipo;
}

/** RF-24: incidencia reportada → mantenimiento */
async function marcarMantenimientoPorIncidencia(equipoId, transaction) {
  const equipo = await Equipo.findByPk(equipoId, { transaction });
  if (!equipo || equipo.estado === ESTADOS.BAJA) return equipo;

  equipo.estado = ESTADOS.MANTENIMIENTO;
  await equipo.save({ transaction });
  return equipo;
}

/** Tras reparar incidencia manualmente → disponible si no hay préstamo activo */
async function marcarDisponibleTrasReparacion(equipoId, transaction) {
  const equipo = await Equipo.findByPk(equipoId, { transaction });
  if (!equipo || equipo.estado !== ESTADOS.MANTENIMIENTO) return equipo;

  const prestamoActivo = await Prestamo.findOne({
    where: { equipo_id: equipoId, estado: 'activo' },
    transaction,
  });

  if (!prestamoActivo) {
    equipo.estado = ESTADOS.DISPONIBLE;
    await equipo.save({ transaction });
  }

  return equipo;
}

module.exports = {
  ESTADOS,
  actualizarEstadoEquipo,
  marcarPrestado,
  marcarDisponiblePorDevolucion,
  marcarMantenimientoPorIncidencia,
  marcarDisponibleTrasReparacion,
};
