const router = require('express').Router();
const analiticaController = require('../controllers/analitica.controller');
const auth = require('../middlewares/auth.middleware');
const { authorizePermiso } = require('../middlewares/roles.middleware');

router.use(auth);

router.get('/dashboard', authorizePermiso('analitica.dashboard'), analiticaController.dashboard);
router.get('/ocupacion', authorizePermiso('analitica.ocupacion'), analiticaController.ocupacion);
router.get('/ausentismo', authorizePermiso('analitica.ausentismo'), analiticaController.ausentismo);
router.get('/inventario-critico', authorizePermiso('analitica.inventarioCritico'), analiticaController.inventarioCritico);
router.get('/cumplimiento-practicas', authorizePermiso('analitica.cumplimientoPracticas'), analiticaController.cumplimientoPracticas);
router.get('/subutilizados', authorizePermiso('analitica.subutilizados'), analiticaController.subutilizados);
router.get('/patrones-cancelacion', authorizePermiso('analitica.patronesCancelacion'), analiticaController.patronesCancelacion);
router.get('/equipos-incidencias', authorizePermiso('analitica.equiposIncidencias'), analiticaController.equiposIncidencias);
router.get('/comparativo-carreras', authorizePermiso('analitica.comparativoCarreras'), analiticaController.comparativoCarreras);
router.get('/indicadores-docente', authorizePermiso('analitica.indicadoresDocente'), analiticaController.indicadoresDocente);

module.exports = router;
