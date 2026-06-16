'use strict';

module.exports = (sequelize, DataTypes) => {
  const Practica = sequelize.define(
    'Practica',
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      docente_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      asignatura: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      periodo: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      laboratorio_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      grupo: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      total_planeadas: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_ejecutadas: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'practicas',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  Practica.associate = (models) => {
    Practica.belongsTo(models.Usuario, { foreignKey: 'docente_id', as: 'docente' });
    Practica.belongsTo(models.Laboratorio, { foreignKey: 'laboratorio_id', as: 'laboratorio' });
  };

  return Practica;
};
