'use strict';

const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define(
    'Usuario',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      contrasena: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      rol_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      estado: {
        type: DataTypes.ENUM('activo', 'inactivo'),
        allowNull: false,
        defaultValue: 'activo',
      },
      fecha_creacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'usuarios',
      underscored: true,
      defaultScope: {
        attributes: { exclude: ['contrasena'] },
      },
      scopes: {
        withPassword: {
          attributes: { include: ['contrasena'] },
        },
      },
    }
  );

  Usuario.beforeCreate(async (usuario) => {
    if (usuario.contrasena) {
      usuario.contrasena = await bcrypt.hash(usuario.contrasena, 10);
    }
  });

  Usuario.beforeUpdate(async (usuario) => {
    if (usuario.changed('contrasena')) {
      usuario.contrasena = await bcrypt.hash(usuario.contrasena, 10);
    }
  });

  Usuario.prototype.validarContrasena = async function (contrasena) {
    return bcrypt.compare(contrasena, this.contrasena);
  };

  Usuario.associate = (models) => {
    Usuario.belongsTo(models.Rol, { foreignKey: 'rol_id', as: 'rol' });
    Usuario.hasMany(models.Sesion, { foreignKey: 'docente_id', as: 'sesiones' });
    Usuario.hasMany(models.Asistencia, { foreignKey: 'estudiante_id', as: 'asistencias' });
    Usuario.hasMany(models.Reserva, { foreignKey: 'docente_id', as: 'reservas' });
    Usuario.hasMany(models.Prestamo, { foreignKey: 'usuario_id', as: 'prestamos' });
    Usuario.hasMany(models.Incidencia, { foreignKey: 'usuario_id', as: 'incidencias' });
    Usuario.hasMany(models.Practica, { foreignKey: 'docente_id', as: 'practicas' });
  };

  return Usuario;
};
