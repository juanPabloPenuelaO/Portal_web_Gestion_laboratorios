const router = require('express').Router();
const reservasController = require('../controllers/reservas.controller');
const auth = require('../middlewares/auth.middleware');
const { authorizePermiso } = require('../middlewares/roles.middleware');

router.use(auth);

router.get('/calendario', authorizePermiso('reservas.calendario'), reservasController.calendario);
router.post('/', authorizePermiso('reservas.solicitar'), reservasController.solicitar);
router.patch('/:id/aprobar', authorizePermiso('reservas.aprobar'), reservasController.aprobar);
router.patch('/:id/rechazar', authorizePermiso('reservas.rechazar'), reservasController.rechazar);
router.patch('/:id/cancelar', authorizePermiso('reservas.cancelar'), reservasController.cancelar);

module.exports = router;
