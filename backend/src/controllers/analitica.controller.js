const { Op } = require('sequelize');
const {
  sequelize,
  Sesion,
  Asistencia,
  Equipo,
  Practica,
  Laboratorio,
  Reserva,
  Incidencia,
  Usuario,
  Rol,
} = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const {
  horasDisponiblesPeriodo,
  calcularPorcentaje,
  duracionHoras,
  UMBRAL_SUBUTILIZACION_DEFAULT,
  UMBRAL_INCIDENCIAS_ALTA,
} = require('../utils/analiticaHelpers');

const validarPeriodo = (fecha_inicio, fecha_fin, res) => {
  if (!fecha_inicio || !fecha_fin) {
    res.status(400).json({ mensaje: 'fecha_inicio y fecha_fin son requeridos' });
    return false;
  }
  return true;
};

// RF-35: Ocupación por laboratorio vs disponibilidad total
const ocupacion = asyncHandler(async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;
  if (!validarPeriodo(fecha_inicio, fecha_fin, res)) return;

  const horasDisponibles = horasDisponiblesPeriodo(fecha_inicio, fecha_fin);
  const laboratorios = await Laboratorio.findAll({ where: { estado: 'activo' } });
  const resultados = [];

  for (const lab of laboratorios) {
    const sesionesList = await Sesion.findAll({
      where: {
        laboratorio_id: lab.id,
        fecha: { [Op.between]: [fecha_inicio, fecha_fin] },
        estado: { [Op.in]: ['abierta', 'cerrada'] },
      },
    });

    const reservasList = await Reserva.findAll({
      where: {
        laboratorio_id: lab.id,
        fecha: { [Op.between]: [fecha_inicio, fecha_fin] },
        estado: 'aprobada',
      },
    });

    const horasSesiones = sesionesList.reduce((acc, s) => {
      return acc + duracionHoras(s.hora_apertura, s.hora_cierre || s.hora_apertura);
    }, 0);

    const horasReservas = reservasList.reduce((acc, r) => {
      return acc + duracionHoras(r.hora_inicio, r.hora_fin);
    }, 0);

    const horasOcupadas = horasSesiones + horasReservas;

    resultados.push({
      laboratorio_id: lab.id,
      laboratorio: lab.nombre,
      capacidad: lab.capacidad,
      horasDisponibles,
      horasOcupadas: Math.round(horasOcupadas * 10) / 10,
      sesiones: sesionesList.length,
      reservas: reservasList.length,
      tasaOcupacion: calcularPorcentaje(horasOcupadas, horasDisponibles),
    });
  }

  res.json({ rf: 'RF-35', periodo: { fecha_inicio, fecha_fin }, horasDisponibles, resultados });
});

// RF-36: Prácticas planeadas vs ejecutadas
const cumplimientoPracticas = asyncHandler(async (req, res) => {
  const { periodo, asignatura, docente_id } = req.query;
  const where = {};
  if (periodo) where.periodo = periodo;
  if (docente_id) where.docente_id = docente_id;
  if (asignatura) where.asignatura = { [Op.like]: `%${asignatura}%` };

  const practicas = await Practica.findAll({
    where,
    include: [
      { model: Usuario, as: 'docente', attributes: ['id', 'nombre'] },
      { model: Laboratorio, as: 'laboratorio', attributes: ['id', 'nombre'] },
    ],
  });

  const resumen = {
    total: practicas.length,
    planeadas: practicas.filter((p) => p.estado === 'planeada').length,
    ejecutadas: practicas.filter((p) => p.estado === 'ejecutada').length,
    canceladas: practicas.filter((p) => p.estado === 'cancelada').length,
  };
  resumen.porcentajeCumplimiento = calcularPorcentaje(resumen.ejecutadas, resumen.total);

  const agrupar = (campo, etiquetaFn) => {
    const map = {};
    practicas.forEach((p) => {
      const key = campo === 'docente' ? p.docente_id : p[campo];
      if (!map[key]) map[key] = { etiqueta: etiquetaFn(p), planeadas: 0, ejecutadas: 0, total: 0 };
      map[key].total += 1;
      if (p.estado === 'planeada') map[key].planeadas += 1;
      if (p.estado === 'ejecutada') map[key].ejecutadas += 1;
    });
    return Object.values(map).map((g) => ({
      ...g,
      porcentaje: calcularPorcentaje(g.ejecutadas, g.total),
    }));
  };

  res.json({
    rf: 'RF-36',
    periodo: periodo || 'todos',
    resumen,
    porAsignatura: agrupar('asignatura', (p) => p.asignatura),
    porDocente: agrupar('docente', (p) => p.docente?.nombre || `Docente #${p.docente_id}`),
    porPeriodo: agrupar('periodo', (p) => p.periodo),
  });
});

// RF-37: Ausentismo por sesión, asignatura y laboratorio
const ausentismo = asyncHandler(async (req, res) => {
  const { fecha_inicio, fecha_fin, capacidad_esperada } = req.query;
  if (!validarPeriodo(fecha_inicio, fecha_fin, res)) return;

  const capacidad = parseInt(capacidad_esperada, 10) || 30;

  const sesiones = await Sesion.findAll({
    where: {
      fecha: { [Op.between]: [fecha_inicio, fecha_fin] },
      estado: 'cerrada',
    },
    include: [
      { model: Asistencia, as: 'asistencias' },
      { model: Laboratorio, as: 'laboratorio' },
      { model: Usuario, as: 'docente', attributes: ['id', 'nombre'] },
    ],
  });

  const reservasPeriodo = await Reserva.findAll({
    where: {
      fecha: { [Op.between]: [fecha_inicio, fecha_fin] },
      estado: { [Op.in]: ['aprobada', 'cancelada'] },
    },
  });

  const porSesion = sesiones.map((s) => {
    const asistentes = s.asistencias.length;
    const reservaMatch = reservasPeriodo.find(
      (r) => r.laboratorio_id === s.laboratorio_id && r.docente_id === s.docente_id && r.fecha === s.fecha
    );
    const cap = s.laboratorio?.capacidad || capacidad;
    const ausentes = Math.max(0, cap - asistentes);

    return {
      sesion_id: s.id,
      fecha: s.fecha,
      laboratorio: s.laboratorio?.nombre,
      laboratorio_id: s.laboratorio_id,
      asignatura: reservaMatch?.asignatura || 'Sin asignatura vinculada',
      asistentes,
      ausentes,
      capacidad: cap,
      porcentajeAusentismo: calcularPorcentaje(ausentes, cap),
    };
  });

  const agruparAusentismo = (campo) => {
    const map = {};
    porSesion.forEach((s) => {
      const key = s[campo] || 'N/A';
      if (!map[key]) map[key] = { etiqueta: key, totalAsistentes: 0, totalCapacidad: 0, sesiones: 0 };
      map[key].totalAsistentes += s.asistentes;
      map[key].totalCapacidad += s.capacidad;
      map[key].sesiones += 1;
    });
    return Object.values(map).map((g) => ({
      ...g,
      porcentajeAusentismo: calcularPorcentaje(g.totalCapacidad - g.totalAsistentes, g.totalCapacidad),
    }));
  };

  res.json({
    rf: 'RF-37',
    periodo: { fecha_inicio, fecha_fin },
    resumen: {
      sesionesAnalizadas: porSesion.length,
      promedioAusentismo: porSesion.length
        ? Math.round(porSesion.reduce((a, s) => a + s.porcentajeAusentismo, 0) / porSesion.length)
        : 0,
    },
    porSesion,
    porAsignatura: agruparAusentismo('asignatura'),
    porLaboratorio: agruparAusentismo('laboratorio'),
  });
});

// RF-38: Alertas equipos críticos
const inventarioCritico = asyncHandler(async (req, res) => {
  const equipos = await Equipo.findAll({
    include: [{ model: Laboratorio, as: 'laboratorio' }],
  });

  const incidenciasPorEquipo = await Incidencia.findAll({
    where: { equipo_id: { [Op.not]: null } },
    attributes: ['equipo_id', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
    group: ['equipo_id'],
    raw: true,
  });

  const mapIncidencias = Object.fromEntries(
    incidenciasPorEquipo.map((i) => [i.equipo_id, parseInt(i.total, 10)])
  );

  const alertas = equipos
    .map((e) => {
      const incidencias = mapIncidencias[e.id] || 0;
      let criticidad = 'baja';
      let motivo = [];

      if (e.estado === 'baja') { criticidad = 'alta'; motivo.push('Fuera de servicio'); }
      if (e.estado === 'mantenimiento') { criticidad = 'media'; motivo.push('En reparación'); }
      if (incidencias >= UMBRAL_INCIDENCIAS_ALTA) {
        criticidad = criticidad === 'alta' ? 'alta' : 'media';
        motivo.push(`Alta rotación de fallas (${incidencias})`);
      }

      return {
        id: e.id,
        nombre: e.nombre,
        categoria: e.categoria,
        estado: e.estado,
        laboratorio: e.laboratorio?.nombre,
        incidencias,
        criticidad,
        motivo: motivo.join('; ') || 'Monitoreo rutinario',
      };
    })
    .filter((a) => a.criticidad !== 'baja' || a.incidencias >= UMBRAL_INCIDENCIAS_ALTA)
    .sort((a, b) => {
      const prio = { alta: 3, media: 2, baja: 1 };
      return (prio[b.criticidad] || 0) - (prio[a.criticidad] || 0);
    });

  res.json({
    rf: 'RF-38',
    total: alertas.length,
    porCriticidad: {
      alta: alertas.filter((a) => a.criticidad === 'alta').length,
      media: alertas.filter((a) => a.criticidad === 'media').length,
    },
    alertas,
  });
});

// RF-39: Laboratorios subutilizados
const subutilizados = asyncHandler(async (req, res) => {
  const { fecha_inicio, fecha_fin, umbral } = req.query;
  if (!validarPeriodo(fecha_inicio, fecha_fin, res)) return;

  const umbralPct = parseInt(umbral, 10) || UMBRAL_SUBUTILIZACION_DEFAULT;
  const horasDisponibles = horasDisponiblesPeriodo(fecha_inicio, fecha_fin);
  const laboratorios = await Laboratorio.findAll({ where: { estado: 'activo' } });
  const resultados = [];

  for (const lab of laboratorios) {
    const sesiones = await Sesion.count({
      where: { laboratorio_id: lab.id, fecha: { [Op.between]: [fecha_inicio, fecha_fin] }, estado: { [Op.in]: ['abierta', 'cerrada'] } },
    });
    const reservas = await Reserva.count({
      where: { laboratorio_id: lab.id, fecha: { [Op.between]: [fecha_inicio, fecha_fin] }, estado: 'aprobada' },
    });
    const horasOcupadas = (sesiones + reservas) * 2;
    const tasa = calcularPorcentaje(horasOcupadas, horasDisponibles);

    if (tasa < umbralPct) {
      resultados.push({
        laboratorio_id: lab.id,
        laboratorio: lab.nombre,
        tasaOcupacion: tasa,
        umbral: umbralPct,
        diferencia: umbralPct - tasa,
        alerta: 'Subutilizado',
      });
    }
  }

  res.json({ rf: 'RF-39', umbral: umbralPct, periodo: { fecha_inicio, fecha_fin }, total: resultados.length, laboratorios: resultados });
});

// RF-40: Patrones de cancelación de reservas
const patronesCancelacion = asyncHandler(async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;
  const where = { estado: 'cancelada' };
  if (fecha_inicio && fecha_fin) where.fecha = { [Op.between]: [fecha_inicio, fecha_fin] };

  const canceladas = await Reserva.findAll({
    where,
    include: [
      { model: Laboratorio, as: 'laboratorio', attributes: ['id', 'nombre'] },
      { model: Usuario, as: 'docente', attributes: ['id', 'nombre'] },
    ],
  });

  const agrupar = (items, keyFn, labelFn) => {
    const map = {};
    items.forEach((r) => {
      const key = keyFn(r);
      if (!map[key]) map[key] = { etiqueta: labelFn(r), cancelaciones: 0 };
      map[key].cancelaciones += 1;
    });
    return Object.values(map).sort((a, b) => b.cancelaciones - a.cancelaciones);
  };

  res.json({
    rf: 'RF-40',
    totalCancelaciones: canceladas.length,
    porDocente: agrupar(canceladas, (r) => r.docente_id, (r) => r.docente?.nombre),
    porLaboratorio: agrupar(canceladas, (r) => r.laboratorio_id, (r) => r.laboratorio?.nombre),
    porAsignatura: agrupar(canceladas, (r) => r.asignatura, (r) => r.asignatura),
    patronesRecurrentes: agrupar(canceladas, (r) => r.asignatura, (r) => r.asignatura).filter((p) => p.cancelaciones >= 2),
  });
});

// RF-41: Equipos con más incidencias
const equiposIncidencias = asyncHandler(async (req, res) => {
  const { limite } = req.query;
  const top = parseInt(limite, 10) || 10;

  const conteos = await Incidencia.findAll({
    where: { equipo_id: { [Op.not]: null } },
    attributes: ['equipo_id', [sequelize.fn('COUNT', sequelize.col('id')), 'total_incidencias']],
    group: ['equipo_id'],
    order: [[sequelize.literal('total_incidencias'), 'DESC']],
    limit: top,
    raw: true,
  });

  const equipos = await Promise.all(
    conteos.map(async (row) => {
      const equipo = await Equipo.findByPk(row.equipo_id, {
        include: [{ model: Laboratorio, as: 'laboratorio' }],
      });
      const total = parseInt(row.total_incidencias, 10);
      return {
        equipo_id: row.equipo_id,
        nombre: equipo?.nombre,
        estado: equipo?.estado,
        laboratorio: equipo?.laboratorio?.nombre,
        totalIncidencias: total,
        prioridad: total >= UMBRAL_INCIDENCIAS_ALTA ? 'alta' : 'media',
      };
    })
  );

  res.json({ rf: 'RF-41', equipos });
});

// RF-42: Comparativo ocupación y cumplimiento por carrera/asignatura
const comparativoCarreras = asyncHandler(async (req, res) => {
  const { fecha_inicio, fecha_fin, periodo } = req.query;

  const wherePractica = {};
  if (periodo) wherePractica.periodo = periodo;

  const practicas = await Practica.findAll({ where: wherePractica });

  const porAsignatura = {};
  practicas.forEach((p) => {
    if (!porAsignatura[p.asignatura]) {
      porAsignatura[p.asignatura] = { asignatura: p.asignatura, planeadas: 0, ejecutadas: 0 };
    }
    if (p.estado === 'planeada') porAsignatura[p.asignatura].planeadas += 1;
    if (p.estado === 'ejecutada') porAsignatura[p.asignatura].ejecutadas += 1;
  });

  const whereReserva = { estado: 'aprobada' };
  if (fecha_inicio && fecha_fin) whereReserva.fecha = { [Op.between]: [fecha_inicio, fecha_fin] };

  const reservas = await Reserva.findAll({ where: whereReserva });

  const porGrupo = {};
  reservas.forEach((r) => {
    if (!porGrupo[r.grupo]) porGrupo[r.grupo] = { carrera_grupo: r.grupo, reservas: 0, asignaturas: new Set() };
    porGrupo[r.grupo].reservas += 1;
    porGrupo[r.grupo].asignaturas.add(r.asignatura);
  });

  res.json({
    rf: 'RF-42',
    porAsignatura: Object.values(porAsignatura).map((a) => ({
      ...a,
      cumplimiento: calcularPorcentaje(a.ejecutadas, a.planeadas + a.ejecutadas),
    })),
    porCarreraGrupo: Object.values(porGrupo).map((g) => ({
      carrera_grupo: g.carrera_grupo,
      reservas: g.reservas,
      asignaturas: [...g.asignaturas],
    })),
  });
});

// RF-43: Indicadores individuales por docente
const indicadoresDocente = asyncHandler(async (req, res) => {
  const { periodo, fecha_inicio, fecha_fin } = req.query;

  const docentes = await Usuario.findAll({
    include: [{ model: Rol, as: 'rol', where: { nombre: 'docente' } }],
    attributes: ['id', 'nombre', 'email'],
  });

  const wherePractica = {};
  if (periodo) wherePractica.periodo = periodo;

  const whereSesion = { estado: 'cerrada' };
  if (fecha_inicio && fecha_fin) whereSesion.fecha = { [Op.between]: [fecha_inicio, fecha_fin] };

  const indicadores = [];

  for (const docente of docentes) {
    const practicas = await Practica.findAll({ where: { ...wherePractica, docente_id: docente.id } });
    const sesiones = await Sesion.findAll({
      where: { ...whereSesion, docente_id: docente.id },
      include: [{ model: Asistencia, as: 'asistencias' }, { model: Laboratorio, as: 'laboratorio' }],
    });
    const incidencias = await Incidencia.count({ where: { usuario_id: docente.id } });

    let totalAsistencia = 0;
    let totalCapacidad = 0;
    sesiones.forEach((s) => {
      const cap = s.laboratorio?.capacidad || 30;
      totalAsistencia += s.asistencias.length;
      totalCapacidad += cap;
    });

    indicadores.push({
      docente_id: docente.id,
      docente: docente.nombre,
      practicasEjecutadas: practicas.filter((p) => p.estado === 'ejecutada').length,
      practicasPlaneadas: practicas.filter((p) => p.estado === 'planeada').length,
      cumplimientoPracticas: calcularPorcentaje(
        practicas.filter((p) => p.estado === 'ejecutada').length,
        practicas.length
      ),
      tasaAsistenciaPromedio: calcularPorcentaje(totalAsistencia, totalCapacidad),
      incidenciasReportadas: incidencias,
      sesionesImpartidas: sesiones.length,
    });
  }

  res.json({ rf: 'RF-43', total: indicadores.length, indicadores });
});

// Dashboard consolidado
const dashboard = asyncHandler(async (req, res) => {
  const { fecha_inicio, fecha_fin, periodo, umbral } = req.query;
  const hoy = new Date().toISOString().slice(0, 10);
  const inicio = fecha_inicio || hoy;
  const fin = fecha_fin || hoy;

  req.query.fecha_inicio = inicio;
  req.query.fecha_fin = fin;
  if (periodo) req.query.periodo = periodo;
  if (umbral) req.query.umbral = umbral;

  const mockRes = {
    statusCode: 200,
    data: {},
    status(code) { this.statusCode = code; return this; },
    json(data) { this.data = data; },
  };

  await ocupacion(req, mockRes);
  const ocupacionData = mockRes.data;

  await ausentismo(req, mockRes);
  const ausentismoData = mockRes.data;

  await inventarioCritico(req, mockRes);
  const inventarioData = mockRes.data;

  req.query.periodo = periodo;
  await cumplimientoPracticas(req, mockRes);
  const practicasData = mockRes.data;

  await subutilizados(req, mockRes);
  const subutilizadosData = mockRes.data;

  await patronesCancelacion(req, mockRes);
  const cancelacionData = mockRes.data;

  await equiposIncidencias(req, mockRes);
  const equiposData = mockRes.data;

  await comparativoCarreras(req, mockRes);
  const comparativoData = mockRes.data;

  await indicadoresDocente(req, mockRes);
  const docentesData = mockRes.data;

  res.json({
    periodo: { fecha_inicio: inicio, fecha_fin: fin, periodo_academico: periodo || null },
    rf35_ocupacion: ocupacionData,
    rf36_practicas: practicasData,
    rf37_ausentismo: ausentismoData,
    rf38_inventarioCritico: inventarioData,
    rf39_subutilizados: subutilizadosData,
    rf40_patronesCancelacion: cancelacionData,
    rf41_equiposIncidencias: equiposData,
    rf42_comparativo: comparativoData,
    rf43_indicadoresDocente: docentesData,
  });
});

module.exports = {
  ocupacion,
  ausentismo,
  inventarioCritico,
  cumplimientoPracticas,
  subutilizados,
  patronesCancelacion,
  equiposIncidencias,
  comparativoCarreras,
  indicadoresDocente,
  dashboard,
};
