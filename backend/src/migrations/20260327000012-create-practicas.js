'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('practicas', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
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
      asignatura: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      periodo: {
        type: Sequelize.STRING(50),
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
      grupo: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      fecha_planeada: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      fecha_ejecutada: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      estado: {
        type: Sequelize.ENUM('planeada', 'ejecutada', 'cancelada'),
        allowNull: false,
        defaultValue: 'planeada',
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

    await queryInterface.addIndex('practicas', ['docente_id']);
    await queryInterface.addIndex('practicas', ['laboratorio_id']);
    await queryInterface.addIndex('practicas', ['fecha_planeada']);
    await queryInterface.addIndex('practicas', ['estado']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('practicas');
  },
};
