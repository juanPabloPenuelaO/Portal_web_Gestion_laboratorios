'use strict';

module.exports = (sequelize, DataTypes) => {
  const Incidencia = sequelize.define(
    'Incidencia',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      equipo_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      sesion_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      tipo_falla: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      foto_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      fecha: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'incidencias',
      underscored: true,
    }
  );

  Incidencia.associate = (models) => {
    Incidencia.belongsTo(models.Equipo, { foreignKey: 'equipo_id', as: 'equipo' });
    Incidencia.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    Incidencia.belongsTo(models.Sesion, { foreignKey: 'sesion_id', as: 'sesion' });
  };

  return Incidencia;
};
