'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('asistencias', {
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
      estudiante_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      metodo: {
        type: Sequelize.ENUM('QR', 'codigo'),
        allowNull: false,
      },
      timestamp: {
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
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('asistencias', ['sesion_id']);
    await queryInterface.addIndex('asistencias', ['estudiante_id']);
    await queryInterface.addIndex('asistencias', ['sesion_id', 'estudiante_id'], {
      unique: true,
      name: 'asistencias_sesion_estudiante_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('asistencias');
  },
};
