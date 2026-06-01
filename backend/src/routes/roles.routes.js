const router = require('express').Router();
const rolesController = require('../controllers/roles.controller');
const auth = require('../middlewares/auth.middleware');
const { authorizePermiso } = require('../middlewares/roles.middleware');

router.get('/', auth, authorizePermiso('roles.listar'), rolesController.listar);

module.exports = router;
