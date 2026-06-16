'use strict';

module.exports = (sequelize, DataTypes) => {
  const Rol = sequelize.define(
    'Rol',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: 'roles',
      timestamps: false,
    }
  );

  Rol.associate = (models) => {
    Rol.hasMany(models.Usuario, { foreignKey: 'rol_id', as: 'usuarios' });
  };

  return Rol;
};
