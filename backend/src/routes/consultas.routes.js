const router = require('express').Router();
const consultasController = require('../controllers/consultas.controller');
const auth = require('../middlewares/auth.middleware');
const { authorizePermiso } = require('../middlewares/roles.middleware');

router.use(auth);

router.get('/incidencias', authorizePermiso('consultas.incidenciasHistorial'), consultasController.historialIncidencias);
router.get('/agenda', authorizePermiso('consultas.agenda'), consultasController.agenda);

module.exports = router;
