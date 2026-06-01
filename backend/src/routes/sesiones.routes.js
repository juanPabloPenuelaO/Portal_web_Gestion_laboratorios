const router = require('express').Router();
const sesionesController = require('../controllers/sesiones.controller');
const auth = require('../middlewares/auth.middleware');
const { authorizePermiso } = require('../middlewares/roles.middleware');

router.use(auth);

router.post('/abrir', authorizePermiso('sesiones.abrir'), sesionesController.abrir);
router.patch('/:id/cerrar', authorizePermiso('sesiones.cerrar'), sesionesController.cerrar);
router.get('/activa/:laboratorio_id', authorizePermiso('sesiones.consultarActiva'), sesionesController.consultarActiva);

module.exports = router;
