'use strict';

module.exports = (sequelize, DataTypes) => {
  const Notificacion = sequelize.define(
    'Notificacion',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      reserva_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      tipo: {
        type: DataTypes.ENUM('solicitud', 'aprobacion', 'rechazo', 'cancelacion'),
        allowNull: false,
      },
      titulo: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      mensaje: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      leida: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'notificaciones',
      underscored: true,
    }
  );

  Notificacion.associate = (models) => {
    Notificacion.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    Notificacion.belongsTo(models.Reserva, { foreignKey: 'reserva_id', as: 'reserva' });
  };

  return Notificacion;
};
