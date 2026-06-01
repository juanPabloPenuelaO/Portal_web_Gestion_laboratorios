const API_BASE = 'http://localhost:3000/api';

const MODULOS = [
  {
    id: 'inicio',
    titulo: 'Inicio',
    icono: '🏠',
    permiso: null,
  },
  {
    id: 'tipos-laboratorio',
    titulo: 'Tipos de laboratorio',
    icono: '🏷️',
    permiso: 'tiposLaboratorio.listar',
    grupo: 'Parametrización',
  },
  {
    id: 'laboratorios',
    titulo: 'Laboratorios',
    icono: '🔬',
    permiso: 'laboratorios.listar',
    grupo: 'Parametrización',
  },
  {
    id: 'usuarios',
    titulo: 'Usuarios',
    icono: '👥',
    permiso: 'usuarios.listar',
    grupo: 'Parametrización',
  },
  {
    id: 'reservas',
    titulo: 'Reservas',
    icono: '📅',
    permiso: 'reservas.calendario',
    grupo: 'Operación',
  },
  {
    id: 'analitica',
    titulo: 'Dashboard analítico',
    icono: '📊',
    permiso: 'analitica.dashboard',
    grupo: 'Operación',
  },
  {
    id: 'inventario',
    titulo: 'Inventario',
    icono: '📦',
    permiso: 'inventario.consultar',
    grupo: 'Operación',
  },
  {
    id: 'practicas',
    titulo: 'Prácticas académicas',
    icono: '📚',
    permiso: 'practicas.seguimiento',
    grupo: 'Operación',
  },
  {
    id: 'consultas',
    titulo: 'Consultas',
    icono: '🔍',
    permiso: 'consultas.agenda',
    grupo: 'Consultas',
  },
  {
    id: 'gobernanza',
    titulo: 'Gobernanza de datos',
    icono: '🛡️',
    permiso: 'gobernanza.politicas',
    grupo: 'Consultas',
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
