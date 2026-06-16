'use strict';

module.exports = (sequelize, DataTypes) => {
  const TipoLaboratorio = sequelize.define(
    'TipoLaboratorio',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'activo',
      },
    },
    {
      tableName: 'tipos_laboratorio',
      timestamps: false,
    }
  );

  TipoLaboratorio.associate = (models) => {
    TipoLaboratorio.hasMany(models.Laboratorio, { foreignKey: 'tipo_id', as: 'laboratorios' });
  };

  return TipoLaboratorio;
};
