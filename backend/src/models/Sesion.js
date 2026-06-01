'use strict';

module.exports = (sequelize, DataTypes) => {
  const Sesion = sequelize.define(
    'Sesion',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      laboratorio_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      docente_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      hora_apertura: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      hora_cierre: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      observaciones: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      estado: {
        type: DataTypes.ENUM('abierta', 'cerrada', 'cancelada'),
        allowNull: false,
        defaultValue: 'abierta',
      },
    },
    {
      tableName: 'sesiones',
      underscored: true,
    }
  );

  Sesion.associate = (models) => {
    Sesion.belongsTo(models.Laboratorio, { foreignKey: 'laboratorio_id', as: 'laboratorio' });
    Sesion.belongsTo(models.Usuario, { foreignKey: 'docente_id', as: 'docente' });
    Sesion.hasMany(models.Asistencia, { foreignKey: 'sesion_id', as: 'asistencias' });
    Sesion.hasMany(models.CodigoQr, { foreignKey: 'sesion_id', as: 'codigosQr' });
    Sesion.hasMany(models.Prestamo, { foreignKey: 'sesion_id', as: 'prestamos' });
    Sesion.hasMany(models.Incidencia, { foreignKey: 'sesion_id', as: 'incidencias' });
  };

  return Sesion;
};
