const API_BASE = 'http://localhost:3000/api';

/** Informe Power BI (GILIH) — abrir en pestaña o capturar ventana en vivo */
const POWER_BI_REPORT_URL = 'https://app.powerbi.com/groups/me/reports/e54484ec-eda3-482e-b978-e6e91a5eb987/75042b8182685cd0d0db?experience=power-bi';

// Iconos SVG inline (heredan color con currentColor)
const ICONOS = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  laboratorios: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6"/><path d="M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7.5 15h9"/></svg>',
  reservas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  inventario: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
  practicas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  analitica: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><rect x="7" y="10" width="3" height="7"/><rect x="12" y="6" width="3" height="11"/><rect x="17" y="13" width="3" height="4"/></svg>',
  consultas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  usuarios: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  tipos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L3.4 13.4a2 2 0 0 1-.59-1.42V4a1 1 0 0 1 1-1h7.99a2 2 0 0 1 1.41.59l7.18 7.18a2 2 0 0 1 0 2.64z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
  gobernanza: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
};

const MODULOS = [
  {
    id: 'inicio',
    titulo: 'Dashboard',
    permiso: null,
    grupo: 'Principal',
    icono: ICONOS.dashboard,
  },
  {
    id: 'laboratorios',
    titulo: 'Laboratorios',
    permiso: 'laboratorios.listar',
    grupo: 'Principal',
    icono: ICONOS.laboratorios,
  },
  {
    id: 'reservas',
    titulo: 'Reservas',
    permiso: 'reservas.calendario',
    grupo: 'Principal',
    icono: ICONOS.reservas,
  },
  {
    id: 'inventario',
    titulo: 'Inventario',
    permiso: 'inventario.consultar',
    grupo: 'Principal',
    icono: ICONOS.inventario,
  },
  {
    id: 'practicas',
    titulo: 'Prácticas académicas',
    permiso: 'practicas.seguimiento',
    grupo: 'Académico',
    icono: ICONOS.practicas,
  },
  {
    id: 'analitica',
    titulo: 'Dashboard analítico',
    permiso: 'analitica.dashboard',
    grupo: 'Académico',
    icono: ICONOS.analitica,
  },
  {
    id: 'consultas',
    titulo: 'Consultas',
    permiso: 'consultas.agenda',
    grupo: 'Académico',
    icono: ICONOS.consultas,
  },
  {
    id: 'usuarios',
    titulo: 'Usuarios',
    permiso: 'usuarios.listar',
    grupo: 'Administración',
    icono: ICONOS.usuarios,
  },
  {
    id: 'tipos-laboratorio',
    titulo: 'Tipos de laboratorio',
    permiso: 'tiposLaboratorio.listar',
    grupo: 'Administración',
    icono: ICONOS.tipos,
  },
  {
    id: 'gobernanza',
    titulo: 'Gobernanza de datos',
    permiso: 'gobernanza.politicas',
    grupo: 'Administración',
    icono: ICONOS.gobernanza,
  },
];

const ETIQUETAS_ROLES = {
  administrador: 'Administrador',
  director_programa: 'Director de programa',
  coordinador: 'Coordinador',
  docente: 'Docente',
  auxiliar: 'Auxiliar',
  estudiante: 'Estudiante',
};
