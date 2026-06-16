/**
 * Valores de estado tal como existen en Supabase (app móvil).
 * El portal web debe leer/escribir estos valores.
 */
const ESTADOS = {
  USUARIO: {
    ACTIVO: 'ACTIVO',
    INACTIVO: 'INACTIVO',
  },
  TIPO_LABORATORIO: {
    ACTIVO: 'ACTIVO',
    INACTIVO: 'INACTIVO',
  },
  LABORATORIO: {
    DISPONIBLE: 'DISPONIBLE',
    EN_MANTENIMIENTO: 'EN_MANTENIMIENTO',
    OCUPADO: 'OCUPADO',
  },
  RESERVA: {
    PENDIENTE: 'PENDIENTE',
    APROBADA: 'APROBADA',
    RECHAZADA: 'RECHAZADA',
    CANCELADA: 'CANCELADA',
  },
  EQUIPO: {
    DISPONIBLE: 'DISPONIBLE',
    PRESTADO: 'PRESTADO',
    EN_MANTENIMIENTO: 'EN_MANTENIMIENTO',
    BAJA: 'BAJA',
  },
  SESION: {
    ACTIVA: 'ACTIVA',
    CERRADA: 'CERRADA',
    CANCELADA: 'CANCELADA',
  },
  PRESTAMO: {
    ACTIVO: 'ACTIVO',
    DEVUELTO: 'DEVUELTO',
    VENCIDO: 'VENCIDO',
  },
  INCIDENCIA: {
    REPORTADA: 'REPORTADA',
  },
};

const esEstado = (valor, esperado) =>
  typeof valor === 'string' && valor.toUpperCase() === esperado.toUpperCase();

const enEstados = (valor, lista) =>
  typeof valor === 'string' && lista.some((e) => esEstado(valor, e));

const mapFiltroLaboratorio = (estado) => {
  if (!estado) return estado;
  const map = {
    activo: 'DISPONIBLE',
    disponible: 'DISPONIBLE',
    mantenimiento: 'EN_MANTENIMIENTO',
    inactivo: 'EN_MANTENIMIENTO',
    ocupado: 'OCUPADO',
  };
  return map[estado.toLowerCase()] || estado.toUpperCase();
};

const mapFiltroActivo = (estado) => {
  if (!estado) return estado;
  if (['activo', 'ACTIVO'].includes(estado)) return 'ACTIVO';
  if (['inactivo', 'INACTIVO'].includes(estado)) return 'INACTIVO';
  return estado.toUpperCase();
};

const mapFiltroEquipo = (estado) => {
  if (!estado) return estado;
  const map = {
    disponible: 'DISPONIBLE',
    prestado: 'PRESTADO',
    mantenimiento: 'EN_MANTENIMIENTO',
    baja: 'BAJA',
  };
  return map[estado.toLowerCase()] || estado.toUpperCase();
};

module.exports = { ESTADOS, esEstado, enEstados, mapFiltroLaboratorio, mapFiltroActivo, mapFiltroEquipo };
