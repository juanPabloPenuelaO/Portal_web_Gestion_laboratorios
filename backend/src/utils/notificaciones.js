const { Op } = require('sequelize');
const { Notificacion, Usuario, Rol } = require('../models');
const { ESTADOS } = require('../config/estados');

const notificacionesHabilitadas = () => process.env.DB_ENABLE_NOTIFICACIONES === 'true';

async function crearNotificacion(payload) {
  if (!notificacionesHabilitadas()) return null;
  return Notificacion.create(payload);
}

async function notificarUsuarios(usuarioIds, payload) {
  if (!notificacionesHabilitadas()) return;
  const unicos = [...new Set(usuarioIds.filter(Boolean))];
  await Promise.all(unicos.map((usuario_id) => crearNotificacion({ ...payload, usuario_id })));
}

async function obtenerCoordinadoresIds() {
  const coordinadores = await Usuario.findAll({
    where: { estado: ESTADOS.USUARIO.ACTIVO },
    include: [{
      model: Rol,
      as: 'rol',
      where: {
        [Op.or]: [
          { nombre: { [Op.iLike]: 'coordinador' } },
          { nombre: { [Op.iLike]: 'director_programa' } },
        ],
      },
    }],
    attributes: ['id'],
  });
  return coordinadores.map((u) => u.id);
}

function resumenReserva(reserva) {
  const lab = reserva.laboratorio?.nombre || `Lab #${reserva.laboratorio_id}`;
  return `${lab} — ${reserva.fecha} ${reserva.hora_inicio}-${reserva.hora_fin} (${reserva.asignatura})`;
}

async function notificarSolicitudReserva(reserva) {
  const coordIds = await obtenerCoordinadoresIds();
  const resumen = resumenReserva(reserva);
  await notificarUsuarios(coordIds, {
    reserva_id: reserva.id,
    tipo: 'solicitud',
    titulo: 'Nueva solicitud de reserva',
    mensaje: `El docente ${reserva.docente?.nombre || ''} solicitó reserva: ${resumen}`,
  });
}

async function notificarAprobacionReserva(reserva, observaciones) {
  const resumen = resumenReserva(reserva);
  let mensaje = `Su reserva fue aprobada: ${resumen}`;
  if (observaciones) mensaje += `. Observaciones: ${observaciones}`;

  await crearNotificacion({
    usuario_id: reserva.docente_id,
    reserva_id: reserva.id,
    tipo: 'aprobacion',
    titulo: 'Reserva aprobada',
    mensaje,
  });
}

async function notificarRechazoReserva(reserva, observaciones) {
  const resumen = resumenReserva(reserva);
  let mensaje = `Su reserva fue rechazada: ${resumen}`;
  if (observaciones) mensaje += `. Motivo: ${observaciones}`;

  await crearNotificacion({
    usuario_id: reserva.docente_id,
    reserva_id: reserva.id,
    tipo: 'rechazo',
    titulo: 'Reserva rechazada',
    mensaje,
  });
}

async function notificarCancelacionReserva(reserva, canceladoPor, motivo) {
  const resumen = resumenReserva(reserva);
  const involucrados = new Set([reserva.docente_id]);

  const coordIds = await obtenerCoordinadoresIds();
  coordIds.forEach((id) => involucrados.add(id));
  involucrados.delete(canceladoPor.id);

  const mensaje = `La reserva ${resumen} fue cancelada por ${canceladoPor.nombre}.${motivo ? ` Motivo: ${motivo}` : ''}`;

  await notificarUsuarios([...involucrados], {
    reserva_id: reserva.id,
    tipo: 'cancelacion',
    titulo: 'Reserva cancelada',
    mensaje,
  });
}

module.exports = {
  crearNotificacion,
  notificarSolicitudReserva,
  notificarAprobacionReserva,
  notificarRechazoReserva,
  notificarCancelacionReserva,
};
