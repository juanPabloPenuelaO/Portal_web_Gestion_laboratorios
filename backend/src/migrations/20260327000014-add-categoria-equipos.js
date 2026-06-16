'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('equipos', 'categoria', {
      type: Sequelize.ENUM('equipo', 'licencia', 'insumo'),
      allowNull: false,
      defaultValue: 'equipo',
    });

    await queryInterface.addIndex('equipos', ['categoria']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('equipos', ['categoria']);
    await queryInterface.removeColumn('equipos', 'categoria');
  },
};
