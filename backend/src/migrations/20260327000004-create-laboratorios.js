'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('laboratorios', {
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
      ubicacion: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      capacidad: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      tipo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tipos_laboratorio',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      estado: {
        type: Sequelize.ENUM('activo', 'inactivo', 'mantenimiento'),
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
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('laboratorios', ['tipo_id']);
    await queryInterface.addIndex('laboratorios', ['estado']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('laboratorios');
  },
};
