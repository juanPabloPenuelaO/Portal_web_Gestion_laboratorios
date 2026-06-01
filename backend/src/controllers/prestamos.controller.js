const { Prestamo, Equipo, Usuario } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { marcarPrestado, marcarDisponiblePorDevolucion } = require('../utils/equipoEstado');

const solicitar = asyncHandler(async (req, res) => {
  const { equipo_id, sesion_id } = req.body;

  if (!equipo_id) return res.status(400).json({ mensaje: 'equipo_id es requerido' });

  const equipo = await Equipo.findByPk(equipo_id);
  if (!equipo) return res.status(404).json({ mensaje: 'Recurso no encontrado' });

  if (equipo.estado !== 'disponible') {
    return res.status(400).json({
      mensaje: 'El recurso no está disponible para préstamo',
      estadoActual: equipo.estado,
    });
  }

  const prestamo = await Prestamo.create({
    equipo_id,
    usuario_id: req.usuario.id,
    sesion_id: sesion_id || null,
    fecha_prestamo: new Date(),
    estado: 'activo',
  });

  await marcarPrestado(equipo_id);

  const prestamoCompleto = await Prestamo.findByPk(prestamo.id, {
    include: [
      { model: Equipo, as: 'equipo' },
      { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] },
    ],
  });

  res.status(201).json({
    mensaje: 'Préstamo registrado. Estado del recurso actualizado a prestado.',
    prestamo: prestamoCompleto,
  });
});

const devolver = asyncHandler(async (req, res) => {
  const prestamo = await Prestamo.findByPk(req.params.id, {
    include: [{ model: Equipo, as: 'equipo' }],
  });

  if (!prestamo) return res.status(404).json({ mensaje: 'Préstamo no encontrado' });

  if (prestamo.estado === 'devuelto') {
    return res.status(400).json({ mensaje: 'El préstamo ya fue devuelto' });
  }

  prestamo.estado = 'devuelto';
  prestamo.fecha_devolucion = new Date();
  await prestamo.save();

  const equipoActualizado = await marcarDisponiblePorDevolucion(prestamo.equipo_id);

  res.json({
    mensaje: 'Equipo devuelto. Estado del recurso actualizado automáticamente.',
    prestamo,
    equipo: equipoActualizado,
  });
});

module.exports = { solicitar, devolver };
