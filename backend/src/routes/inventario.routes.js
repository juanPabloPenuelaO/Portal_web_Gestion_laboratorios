const router = require('express').Router();
const inventarioController = require('../controllers/inventario.controller');
const auth = require('../middlewares/auth.middleware');
const { authorizePermiso } = require('../middlewares/roles.middleware');

router.use(auth);

router.get('/catalogo', authorizePermiso('inventario.consultar'), inventarioController.listarCategorias);
router.get('/laboratorio/:laboratorio_id', authorizePermiso('inventario.consultar'), inventarioController.consultarPorLaboratorio);
router.post('/', authorizePermiso('inventario.registrar'), inventarioController.registrarEquipo);
router.patch('/:id/estado', authorizePermiso('inventario.actualizarEstado'), inventarioController.actualizarEstado);
router.patch('/:id/reparar', authorizePermiso('inventario.actualizarEstado'), inventarioController.reparar);

module.exports = router;
