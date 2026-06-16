'use strict';

module.exports = (sequelize, DataTypes) => {
  const Asistencia = sequelize.define(
    'Asistencia',
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
      estudiante_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      metodo: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'asistencias',
      timestamps: false,
    }
  );

  Asistencia.associate = (models) => {
    Asistencia.belongsTo(models.Sesion, { foreignKey: 'sesion_id', as: 'sesion' });
    Asistencia.belongsTo(models.Usuario, { foreignKey: 'estudiante_id', as: 'estudiante' });
  };

  return Asistencia;
};
