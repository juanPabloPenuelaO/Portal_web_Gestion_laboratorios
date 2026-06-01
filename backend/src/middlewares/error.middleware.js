const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      mensaje: 'Error de validación',
      errores: err.errors.map((e) => ({ campo: e.path, mensaje: e.message })),
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      mensaje: 'El registro ya existe',
      campo: err.errors?.[0]?.path,
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ mensaje: 'Referencia inválida en los datos enviados' });
  }

  res.status(err.status || 500).json({
    mensaje: err.message || 'Error interno del servidor',
  });
};

module.exports = errorHandler;
