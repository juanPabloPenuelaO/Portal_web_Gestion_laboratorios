'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('codigos_qr', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      sesion_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'sesiones',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      codigo: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      vigencia: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      estado: {
        type: Sequelize.ENUM('activo', 'expirado', 'usado'),
        allowNull: false,
        defaultValue: 'activo',
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

    await queryInterface.addIndex('codigos_qr', ['sesion_id']);
    await queryInterface.addIndex('codigos_qr', ['codigo']);
    await queryInterface.addIndex('codigos_qr', ['estado']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('codigos_qr');
  },
};
