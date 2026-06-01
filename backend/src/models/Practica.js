'use strict';

module.exports = (sequelize, DataTypes) => {
  const Practica = sequelize.define(
    'Practica',
    {
      id: {
        type: DataTypes.INTEGER,
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
      fecha_planeada: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      fecha_ejecutada: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      estado: {
        type: DataTypes.ENUM('planeada', 'ejecutada', 'cancelada'),
        allowNull: false,
        defaultValue: 'planeada',
      },
    },
    {
      tableName: 'practicas',
      underscored: true,
    }
  );

  Practica.associate = (models) => {
    Practica.belongsTo(models.Usuario, { foreignKey: 'docente_id', as: 'docente' });
    Practica.belongsTo(models.Laboratorio, { foreignKey: 'laboratorio_id', as: 'laboratorio' });
  };

  return Practica;
};
