const { Equipo, Prestamo } = require('../models');
const { ESTADOS, esEstado } = require('../config/estados');

async function actualizarEstadoEquipo(equipoId, nuevoEstado, { transaction } = {}) {
  const equipo = await Equipo.findByPk(equipoId, { transaction });
  if (!equipo) return null;

  if (esEstado(equipo.estado, ESTADOS.EQUIPO.BAJA) && !esEstado(nuevoEstado, ESTADOS.EQUIPO.BAJA)) {
    return equipo;
  }

  equipo.estado = nuevoEstado;
  await equipo.save({ transaction });
  return equipo;
}

async function marcarPrestado(equipoId, transaction) {
  return actualizarEstadoEquipo(equipoId, ESTADOS.EQUIPO.PRESTADO, { transaction });
}

async function marcarDisponiblePorDevolucion(equipoId, transaction) {
  const equipo = await Equipo.findByPk(equipoId, { transaction });
  if (!equipo) return null;

  if (esEstado(equipo.estado, ESTADOS.EQUIPO.PRESTADO)) {
    equipo.estado = ESTADOS.EQUIPO.DISPONIBLE;
    await equipo.save({ transaction });
  }

  return equipo;
}

async function marcarMantenimientoPorIncidencia(equipoId, transaction) {
  const equipo = await Equipo.findByPk(equipoId, { transaction });
  if (!equipo || esEstado(equipo.estado, ESTADOS.EQUIPO.BAJA)) return equipo;

  equipo.estado = ESTADOS.EQUIPO.EN_MANTENIMIENTO;
  await equipo.save({ transaction });
  return equipo;
}

async function marcarDisponibleTrasReparacion(equipoId, transaction) {
  const equipo = await Equipo.findByPk(equipoId, { transaction });
  if (!equipo || !esEstado(equipo.estado, ESTADOS.EQUIPO.EN_MANTENIMIENTO)) return equipo;

  const prestamoActivo = await Prestamo.findOne({
    where: { equipo_id: equipoId, estado: ESTADOS.PRESTAMO.ACTIVO },
    transaction,
  });

  if (!prestamoActivo) {
    equipo.estado = ESTADOS.EQUIPO.DISPONIBLE;
    await equipo.save({ transaction });
  }

  return equipo;
}

module.exports = {
  ESTADOS: ESTADOS.EQUIPO,
  actualizarEstadoEquipo,
  marcarPrestado,
  marcarDisponiblePorDevolucion,
  marcarMantenimientoPorIncidencia,
  marcarDisponibleTrasReparacion,
};
