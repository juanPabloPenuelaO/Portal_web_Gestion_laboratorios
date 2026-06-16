'use strict';

module.exports = (sequelize, DataTypes) => {
  const Laboratorio = sequelize.define(
    'Laboratorio',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      ubicacion: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      capacidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      tipo_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'activo',
      },
      equipamiento: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'laboratorios',
      timestamps: false,
    }
  );

  Laboratorio.associate = (models) => {
    Laboratorio.belongsTo(models.TipoLaboratorio, { foreignKey: 'tipo_id', as: 'tipo' });
    Laboratorio.hasMany(models.Sesion, { foreignKey: 'laboratorio_id', as: 'sesiones' });
    Laboratorio.hasMany(models.Reserva, { foreignKey: 'laboratorio_id', as: 'reservas' });
    Laboratorio.hasMany(models.Equipo, { foreignKey: 'laboratorio_id', as: 'equipos' });
    Laboratorio.hasMany(models.Practica, { foreignKey: 'laboratorio_id', as: 'practicas' });
    Laboratorio.hasMany(models.Incidencia, { foreignKey: 'laboratorio_id', as: 'incidencias' });
  };

  return Laboratorio;
};
