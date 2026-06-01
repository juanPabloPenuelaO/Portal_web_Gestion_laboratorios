const router = require('express').Router();
const practicasController = require('../controllers/practicas.controller');
const auth = require('../middlewares/auth.middleware');
const { authorizePermiso } = require('../middlewares/roles.middleware');

router.use(auth);

router.post('/', authorizePermiso('practicas.planear'), practicasController.planear);
router.patch('/:id/ejecutar', authorizePermiso('practicas.ejecutar'), practicasController.ejecutar);
router.get('/seguimiento', authorizePermiso('practicas.seguimiento'), practicasController.seguimiento);

module.exports = router;
