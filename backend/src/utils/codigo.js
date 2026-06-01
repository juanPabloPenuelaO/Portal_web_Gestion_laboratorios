const crypto = require('crypto');

const generarCodigo = (prefijo = 'GIL') => {
  const aleatorio = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefijo}-${Date.now().toString(36).toUpperCase()}-${aleatorio}`;
};

const horaActual = () => {
  const ahora = new Date();
  return ahora.toTimeString().slice(0, 8);
};

const fechaActual = () => new Date().toISOString().slice(0, 10);

module.exports = { generarCodigo, horaActual, fechaActual };
