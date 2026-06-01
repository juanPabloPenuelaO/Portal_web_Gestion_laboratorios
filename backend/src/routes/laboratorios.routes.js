const router = require('express').Router();
const laboratoriosController = require('../controllers/laboratorios.controller');
const auth = require('../middlewares/auth.middleware');
const { authorizePermiso } = require('../middlewares/roles.middleware');

router.get('/disponibilidad', auth, authorizePermiso('laboratorios.disponibilidad'), laboratoriosController.disponibilidad);
router.get('/', auth, authorizePermiso('laboratorios.listar'), laboratoriosController.listar);

router.post('/', auth, authorizePermiso('laboratorios.crear'), laboratoriosController.crear);
router.put('/:id', auth, authorizePermiso('laboratorios.actualizar'), laboratoriosController.actualizar);
router.patch('/:id/desactivar', auth, authorizePermiso('laboratorios.desactivar'), laboratoriosController.desactivar);

module.exports = router;
