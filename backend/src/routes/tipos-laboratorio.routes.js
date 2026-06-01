const router = require('express').Router();
const tiposController = require('../controllers/tipos-laboratorio.controller');
const auth = require('../middlewares/auth.middleware');
const { authorizePermiso } = require('../middlewares/roles.middleware');

router.use(auth);

router.get('/', authorizePermiso('tiposLaboratorio.listar'), tiposController.listar);
router.post('/', authorizePermiso('tiposLaboratorio.crear'), tiposController.crear);
router.put('/:id', authorizePermiso('tiposLaboratorio.actualizar'), tiposController.actualizar);
router.patch('/:id/desactivar', authorizePermiso('tiposLaboratorio.desactivar'), tiposController.desactivar);

module.exports = router;
