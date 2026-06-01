const router = require('express').Router();
const incidenciasController = require('../controllers/incidencias.controller');
const auth = require('../middlewares/auth.middleware');
const { authorizePermiso } = require('../middlewares/roles.middleware');

router.use(auth);

router.post('/', authorizePermiso('incidencias.reportar'), incidenciasController.reportar);
router.get('/', authorizePermiso('incidencias.listar'), incidenciasController.listar);

module.exports = router;
