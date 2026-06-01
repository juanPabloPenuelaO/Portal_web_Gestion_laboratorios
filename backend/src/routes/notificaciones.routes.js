const router = require('express').Router();
const notificacionesController = require('../controllers/notificaciones.controller');
const auth = require('../middlewares/auth.middleware');

router.use(auth);

router.get('/', notificacionesController.listar);
router.patch('/leer-todas', notificacionesController.marcarTodasLeidas);
router.patch('/:id/leida', notificacionesController.marcarLeida);

module.exports = router;
