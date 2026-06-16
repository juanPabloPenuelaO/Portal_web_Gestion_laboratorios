'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sesiones', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      laboratorio_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'laboratorios',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      docente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      hora_apertura: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      hora_cierre: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      observaciones: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      estado: {
        type: Sequelize.ENUM('abierta', 'cerrada', 'cancelada'),
        allowNull: false,
        defaultValue: 'abierta',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('sesiones', ['laboratorio_id']);
    await queryInterface.addIndex('sesiones', ['docente_id']);
    await queryInterface.addIndex('sesiones', ['fecha']);
    await queryInterface.addIndex('sesiones', ['estado']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('sesiones');
  },
};
