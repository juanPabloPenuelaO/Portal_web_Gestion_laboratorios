'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notificaciones', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      reserva_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'reservas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      tipo: {
        type: Sequelize.ENUM('solicitud', 'aprobacion', 'rechazo', 'cancelacion'),
        allowNull: false,
      },
      titulo: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      mensaje: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      leida: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

    await queryInterface.addIndex('notificaciones', ['usuario_id']);
    await queryInterface.addIndex('notificaciones', ['leida']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notificaciones');
  },
};
