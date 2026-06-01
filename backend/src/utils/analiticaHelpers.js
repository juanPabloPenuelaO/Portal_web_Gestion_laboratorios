const HORAS_LABORABLES_DIA = 8;
const UMBRAL_SUBUTILIZACION_DEFAULT = 30;
const UMBRAL_INCIDENCIAS_ALTA = 3;

function diasEnPeriodo(fechaInicio, fechaFin) {
  return Math.max(1, Math.ceil((new Date(fechaFin) - new Date(fechaInicio)) / 86400000) + 1);
}

function horasDisponiblesPeriodo(fechaInicio, fechaFin) {
  return diasEnPeriodo(fechaInicio, fechaFin) * HORAS_LABORABLES_DIA;
}

function calcularPorcentaje(parte, total) {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.round((parte / total) * 100));
}

function duracionHoras(horaInicio, horaFin) {
  if (!horaInicio || !horaFin) return 2;
  const [h1, m1] = horaInicio.split(':').map(Number);
  const [h2, m2] = horaFin.split(':').map(Number);
  const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  return Math.max(0.5, mins / 60);
}

module.exports = {
  HORAS_LABORABLES_DIA,
  UMBRAL_SUBUTILIZACION_DEFAULT,
  UMBRAL_INCIDENCIAS_ALTA,
  diasEnPeriodo,
  horasDisponiblesPeriodo,
  calcularPorcentaje,
  duracionHoras,
};
