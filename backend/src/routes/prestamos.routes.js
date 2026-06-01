const router = require('express').Router();
const prestamosController = require('../controllers/prestamos.controller');
const auth = require('../middlewares/auth.middleware');
const { authorizePermiso } = require('../middlewares/roles.middleware');

router.use(auth);

router.post('/', authorizePermiso('prestamos.solicitar'), prestamosController.solicitar);
router.patch('/:id/devolver', authorizePermiso('prestamos.devolver'), prestamosController.devolver);

module.exports = router;
