const resumenPracticas = (practicas) => {
  const planeada = practicas.reduce((acc, p) => acc + (p.total_planeadas || 0), 0);
  const ejecutada = practicas.reduce((acc, p) => acc + (p.total_ejecutadas || 0), 0);
  const pendiente = practicas.reduce(
    (acc, p) => acc + Math.max(0, (p.total_planeadas || 0) - (p.total_ejecutadas || 0)),
    0
  );

  return {
    total: practicas.length,
    planeada,
    ejecutada,
    pendiente,
    porcentajeCumplimiento: planeada > 0 ? Math.round((ejecutada / planeada) * 100) : 0,
  };
};

const agruparPracticas = (practicas, campo, etiquetaFn) => {
  const grupos = {};

  practicas.forEach((p) => {
    const clave = campo === 'docente' ? p.docente_id : p[campo];
    const etiqueta = etiquetaFn(p);

    if (!grupos[clave]) {
      grupos[clave] = {
        id: campo === 'docente' ? p.docente_id : clave,
        etiqueta,
        planeadas: 0,
        ejecutadas: 0,
        pendientes: 0,
        total: 0,
        porcentajeEjecucion: 0,
      };
    }

    grupos[clave].total += 1;
    grupos[clave].planeadas += p.total_planeadas || 0;
    grupos[clave].ejecutadas += p.total_ejecutadas || 0;
    grupos[clave].pendientes += Math.max(0, (p.total_planeadas || 0) - (p.total_ejecutadas || 0));
  });

  return Object.values(grupos).map((g) => ({
    ...g,
    porcentajeEjecucion: g.planeadas > 0 ? Math.round((g.ejecutadas / g.planeadas) * 100) : 0,
  }));
};

const practicaPendiente = (p) => (p.total_planeadas || 0) > (p.total_ejecutadas || 0);

const estadoPractica = (p) => {
  const plan = p.total_planeadas || 0;
  const ejec = p.total_ejecutadas || 0;
  if (plan > 0 && ejec >= plan) return 'ejecutada';
  if (ejec > 0) return 'parcial';
  return 'planeada';
};

module.exports = {
  resumenPracticas,
  agruparPracticas,
  practicaPendiente,
  estadoPractica,
};
