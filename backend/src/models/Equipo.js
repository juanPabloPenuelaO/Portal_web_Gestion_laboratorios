'use strict';

module.exports = (sequelize, DataTypes) => {
  const Equipo = sequelize.define(
    'Equipo',
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
      numero_serie: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
      },
      categoria: {
        type: DataTypes.ENUM('equipo', 'licencia', 'insumo'),
        allowNull: false,
        defaultValue: 'equipo',
      },
      tipo: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      estado: {
        type: DataTypes.ENUM('disponible', 'prestado', 'mantenimiento', 'baja'),
        allowNull: false,
        defaultValue: 'disponible',
      },
      laboratorio_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'equipos',
      underscored: true,
    }
  );

  Equipo.associate = (models) => {
    Equipo.belongsTo(models.Laboratorio, { foreignKey: 'laboratorio_id', as: 'laboratorio' });
    Equipo.hasMany(models.Prestamo, { foreignKey: 'equipo_id', as: 'prestamos' });
    Equipo.hasMany(models.Incidencia, { foreignKey: 'equipo_id', as: 'incidencias' });
  };

  return Equipo;
};
