'use strict';

module.exports = (sequelize, DataTypes) => {
  const CodigoQr = sequelize.define(
    'CodigoQr',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      sesion_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      codigo: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      vigencia: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      estado: {
        type: DataTypes.ENUM('activo', 'expirado', 'usado'),
        allowNull: false,
        defaultValue: 'activo',
      },
    },
    {
      tableName: 'codigos_qr',
      underscored: true,
    }
  );

  CodigoQr.associate = (models) => {
    CodigoQr.belongsTo(models.Sesion, { foreignKey: 'sesion_id', as: 'sesion' });
  };

  return CodigoQr;
};
