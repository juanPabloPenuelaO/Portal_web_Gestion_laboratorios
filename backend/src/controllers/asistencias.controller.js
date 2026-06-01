const { Asistencia, CodigoQr, Sesion, Usuario } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { generarCodigo } = require('../utils/codigo');

const registrarPorQR = asyncHandler(async (req, res) => {
  const { codigo } = req.body;

  if (!codigo) return res.status(400).json({ mensaje: 'codigo es requerido' });

  const codigoQr = await CodigoQr.findOne({
    where: { codigo, estado: 'activo' },
    include: [{ model: Sesion, as: 'sesion' }],
  });

  if (!codigoQr) return res.status(404).json({ mensaje: 'Código QR no válido' });

  if (new Date() > new Date(codigoQr.vigencia)) {
    codigoQr.estado = 'expirado';
    await codigoQr.save();
    return res.status(400).json({ mensaje: 'Código QR expirado' });
  }

  if (codigoQr.sesion.estado !== 'abierta') {
    return res.status(400).json({ mensaje: 'La sesión no está activa' });
  }

  const existente = await Asistencia.findOne({
    where: { sesion_id: codigoQr.sesion_id, estudiante_id: req.usuario.id },
  });

  if (existente) {
    return res.status(409).json({ mensaje: 'Ya registraste asistencia en esta sesión' });
  }

  const asistencia = await Asistencia.create({
    sesion_id: codigoQr.sesion_id,
    estudiante_id: req.usuario.id,
    metodo: 'QR',
    timestamp: new Date(),
  });

  res.status(201).json({ mensaje: 'Asistencia registrada', asistencia });
});

const registrarPorCodigo = asyncHandler(async (req, res) => {
  const { codigo } = req.body;

  if (!codigo) return res.status(400).json({ mensaje: 'codigo es requerido' });

  const codigoTemp = await CodigoQr.findOne({
    where: { codigo, estado: 'activo' },
    include: [{ model: Sesion, as: 'sesion' }],
  });

  if (!codigoTemp) return res.status(404).json({ mensaje: 'Código temporal no válido' });

  if (new Date() > new Date(codigoTemp.vigencia)) {
    codigoTemp.estado = 'expirado';
    await codigoTemp.save();
    return res.status(400).json({ mensaje: 'Código temporal expirado' });
  }

  if (codigoTemp.sesion.estado !== 'abierta') {
    return res.status(400).json({ mensaje: 'La sesión no está activa' });
  }

  const existente = await Asistencia.findOne({
    where: { sesion_id: codigoTemp.sesion_id, estudiante_id: req.usuario.id },
  });

  if (existente) {
    return res.status(409).json({ mensaje: 'Ya registraste asistencia en esta sesión' });
  }

  const asistencia = await Asistencia.create({
    sesion_id: codigoTemp.sesion_id,
    estudiante_id: req.usuario.id,
    metodo: 'codigo',
    timestamp: new Date(),
  });

  codigoTemp.estado = 'usado';
  await codigoTemp.save();

  res.status(201).json({ mensaje: 'Asistencia registrada por código', asistencia });
});

const listarPorSesion = asyncHandler(async (req, res) => {
  const { sesion_id } = req.params;

  const sesion = await Sesion.findByPk(sesion_id);
  if (!sesion) return res.status(404).json({ mensaje: 'Sesión no encontrada' });

  const asistencias = await Asistencia.findAll({
    where: { sesion_id },
    include: [{ model: Usuario, as: 'estudiante', attributes: ['id', 'nombre', 'email'] }],
    order: [['timestamp', 'ASC']],
  });

  res.json({ sesion_id, total: asistencias.length, asistencias });
});

const generarCodigoTemporal = asyncHandler(async (req, res) => {
  const { sesion_id } = req.body;

  const sesion = await Sesion.findByPk(sesion_id);
  if (!sesion || sesion.estado !== 'abierta') {
    return res.status(400).json({ mensaje: 'Sesión no activa' });
  }

  const vigencia = new Date();
  vigencia.setMinutes(vigencia.getMinutes() + 15);

  const codigo = await CodigoQr.create({
    sesion_id,
    codigo: generarCodigo('TMP'),
    vigencia,
    estado: 'activo',
  });

  res.status(201).json({ mensaje: 'Código temporal generado', codigo: codigo.codigo, vigencia: codigo.vigencia });
});

module.exports = { registrarPorQR, registrarPorCodigo, listarPorSesion, generarCodigoTemporal };
