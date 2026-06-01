const { Sesion, Laboratorio, Usuario, CodigoQr } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { generarCodigo, horaActual, fechaActual } = require('../utils/codigo');

const abrir = asyncHandler(async (req, res) => {
  const { laboratorio_id, observaciones } = req.body;

  if (!laboratorio_id) {
    return res.status(400).json({ mensaje: 'laboratorio_id es requerido' });
  }

  const laboratorio = await Laboratorio.findByPk(laboratorio_id);
  if (!laboratorio || laboratorio.estado !== 'activo') {
    return res.status(400).json({ mensaje: 'Laboratorio no disponible' });
  }

  const sesionActiva = await Sesion.findOne({
    where: { laboratorio_id, estado: 'abierta' },
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
    observaciones,
    estado: 'abierta',
  });

  const vigencia = new Date();
  vigencia.setHours(vigencia.getHours() + 4);

  const codigoQr = await CodigoQr.create({
    sesion_id: sesion.id,
    codigo: generarCodigo('QR'),
    vigencia,
    estado: 'activo',
  });

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
    codigoQr: codigoQr.codigo,
    vigencia: codigoQr.vigencia,
  });
});

const cerrar = asyncHandler(async (req, res) => {
  const sesion = await Sesion.findByPk(req.params.id);
  if (!sesion) return res.status(404).json({ mensaje: 'Sesión no encontrada' });

  if (sesion.estado !== 'abierta') {
    return res.status(400).json({ mensaje: 'La sesión no está abierta' });
  }

  const { observaciones } = req.body;
  sesion.hora_cierre = horaActual();
  sesion.observaciones = observaciones || sesion.observaciones;
  sesion.estado = 'cerrada';
  await sesion.save();

  await CodigoQr.update({ estado: 'expirado' }, { where: { sesion_id: sesion.id, estado: 'activo' } });

  res.json({ mensaje: 'Sesión cerrada', sesion });
});

const consultarActiva = asyncHandler(async (req, res) => {
  const { laboratorio_id } = req.params;

  const sesion = await Sesion.findOne({
    where: { laboratorio_id, estado: 'abierta' },
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
