'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reservas', {
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
      hora_inicio: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      hora_fin: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      asignatura: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      grupo: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'aprobada', 'rechazada', 'cancelada'),
        allowNull: false,
        defaultValue: 'pendiente',
      },
      observaciones: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    await queryInterface.addIndex('reservas', ['laboratorio_id']);
    await queryInterface.addIndex('reservas', ['docente_id']);
    await queryInterface.addIndex('reservas', ['fecha']);
    await queryInterface.addIndex('reservas', ['estado']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('reservas');
  },
};
