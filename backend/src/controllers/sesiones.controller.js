const { Sesion, Laboratorio, Usuario, CodigoQr } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { generarCodigo, horaActual, fechaActual } = require('../utils/codigo');
const { ESTADOS, esEstado } = require('../config/estados');

const abrir = asyncHandler(async (req, res) => {
  const { laboratorio_id, observaciones, observaciones_apertura } = req.body;
  const notasApertura = observaciones_apertura ?? observaciones;

  if (!laboratorio_id) {
    return res.status(400).json({ mensaje: 'laboratorio_id es requerido' });
  }

  const laboratorio = await Laboratorio.findByPk(laboratorio_id);
  if (!laboratorio || !esEstado(laboratorio.estado, ESTADOS.LABORATORIO.DISPONIBLE)) {
    return res.status(400).json({ mensaje: 'Laboratorio no disponible' });
  }

  const sesionActiva = await Sesion.findOne({
    where: { laboratorio_id, estado: ESTADOS.SESION.ACTIVA },
  });

  if (sesionActiva) {
    return res.status(409).json({ mensaje: 'Ya existe una sesión activa en este laboratorio' });
  }

  const docente_id = req.usuario.rol === 'docente' ? req.usuario.id : req.body.docente_id || req.usuario.id;

  const sesion = await Sesion.create({
    laboratorio_id,
    docente_id,
    fecha: fechaActual(),
    hora_apertura: horaActual(),
    observaciones_apertura: notasApertura || null,
    estado: ESTADOS.SESION.ACTIVA,
  });

  let codigoQr = null;
  try {
    const vigencia = new Date();
    vigencia.setHours(vigencia.getHours() + 4);

    codigoQr = await CodigoQr.create({
      sesion_id: sesion.id,
      codigo: generarCodigo('QR'),
      vigencia,
      estado: 'activo',
    });
  } catch (_) {
    // Tabla codigos_qr usada por la app móvil; el portal web no la requiere.
  }

  const sesionCompleta = await Sesion.findByPk(sesion.id, {
    include: [
      { model: Laboratorio, as: 'laboratorio' },
      { model: Usuario, as: 'docente', attributes: ['id', 'nombre', 'email'] },
      { model: CodigoQr, as: 'codigosQr' },
    ],
  });

  res.status(201).json({
    mensaje: 'Sesión abierta',
    sesion: sesionCompleta,
    codigoQr: codigoQr?.codigo || null,
    vigencia: codigoQr?.vigencia || null,
  });
});

const cerrar = asyncHandler(async (req, res) => {
  const sesion = await Sesion.findByPk(req.params.id);
  if (!sesion) return res.status(404).json({ mensaje: 'Sesión no encontrada' });

  if (!esEstado(sesion.estado, ESTADOS.SESION.ACTIVA)) {
    return res.status(400).json({ mensaje: 'La sesión no está abierta' });
  }

  const { observaciones, observaciones_cierre } = req.body;
  sesion.hora_cierre = horaActual();
  sesion.observaciones_cierre = observaciones_cierre ?? observaciones ?? sesion.observaciones_cierre;
  sesion.estado = ESTADOS.SESION.CERRADA;
  await sesion.save();

  await CodigoQr.update({ estado: 'expirado' }, { where: { sesion_id: sesion.id, estado: 'activo' } }).catch(() => {});

  res.json({ mensaje: 'Sesión cerrada', sesion });
});

const consultarActiva = asyncHandler(async (req, res) => {
  const { laboratorio_id } = req.params;

  const sesion = await Sesion.findOne({
    where: { laboratorio_id, estado: ESTADOS.SESION.ACTIVA },
    include: [
      { model: Laboratorio, as: 'laboratorio' },
      { model: Usuario, as: 'docente', attributes: ['id', 'nombre', 'email'] },
      { model: CodigoQr, as: 'codigosQr', where: { estado: 'activo' }, required: false },
    ],
  });

  if (!sesion) {
    return res.json({ activa: false, sesion: null });
  }

  res.json({ activa: true, sesion });
});

module.exports = { abrir, cerrar, consultarActiva };
