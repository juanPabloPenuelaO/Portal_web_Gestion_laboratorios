'use strict';

module.exports = (sequelize, DataTypes) => {
  const Prestamo = sequelize.define(
    'Prestamo',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      equipo_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      sesion_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      fecha_prestamo: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      fecha_devolucion: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      estado: {
        type: DataTypes.ENUM('activo', 'devuelto', 'vencido'),
        allowNull: false,
        defaultValue: 'activo',
      },
    },
    {
      tableName: 'prestamos',
      underscored: true,
    }
  );

  Prestamo.associate = (models) => {
    Prestamo.belongsTo(models.Equipo, { foreignKey: 'equipo_id', as: 'equipo' });
    Prestamo.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    Prestamo.belongsTo(models.Sesion, { foreignKey: 'sesion_id', as: 'sesion' });
  };

  return Prestamo;
};
