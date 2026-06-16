'use strict';

module.exports = (sequelize, DataTypes) => {
  const Reserva = sequelize.define(
    'Reserva',
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
      hora_inicio: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      hora_fin: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      asignatura: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      grupo: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pendiente',
      },
      observaciones: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'reservas',
      timestamps: false,
    }
  );

  Reserva.associate = (models) => {
    Reserva.belongsTo(models.Laboratorio, { foreignKey: 'laboratorio_id', as: 'laboratorio' });
    Reserva.belongsTo(models.Usuario, { foreignKey: 'docente_id', as: 'docente' });
  };

  return Reserva;
};
