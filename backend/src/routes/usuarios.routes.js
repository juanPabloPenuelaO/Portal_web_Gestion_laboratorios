const router = require('express').Router();
const usuariosController = require('../controllers/usuarios.controller');
const auth = require('../middlewares/auth.middleware');
const { authorizePermiso } = require('../middlewares/roles.middleware');

router.use(auth);

router.post('/', authorizePermiso('usuarios.crear'), usuariosController.crear);
router.get('/', authorizePermiso('usuarios.listar'), usuariosController.listar);
router.put('/:id', authorizePermiso('usuarios.actualizar'), usuariosController.actualizar);
router.patch('/:id/desactivar', authorizePermiso('usuarios.desactivar'), usuariosController.desactivar);

module.exports = router;
