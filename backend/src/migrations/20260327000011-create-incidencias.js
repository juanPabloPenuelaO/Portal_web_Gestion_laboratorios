'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('incidencias', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      equipo_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'equipos',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      sesion_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'sesiones',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      tipo_falla: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      foto_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      fecha: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('incidencias', ['equipo_id']);
    await queryInterface.addIndex('incidencias', ['usuario_id']);
    await queryInterface.addIndex('incidencias', ['sesion_id']);
    await queryInterface.addIndex('incidencias', ['fecha']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('incidencias');
  },
};
