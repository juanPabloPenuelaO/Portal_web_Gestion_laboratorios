'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('equipos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      nombre: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      numero_serie: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
      },
      tipo: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      estado: {
        type: Sequelize.ENUM('disponible', 'prestado', 'mantenimiento', 'baja'),
        allowNull: false,
        defaultValue: 'disponible',
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

    await queryInterface.addIndex('equipos', ['laboratorio_id']);
    await queryInterface.addIndex('equipos', ['estado']);
    await queryInterface.addIndex('equipos', ['numero_serie']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('equipos');
  },
};
