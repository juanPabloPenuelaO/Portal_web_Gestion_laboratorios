const router = require('express').Router();
const asistenciasController = require('../controllers/asistencias.controller');
const auth = require('../middlewares/auth.middleware');
const { authorizePermiso } = require('../middlewares/roles.middleware');

router.use(auth);

router.post('/qr', authorizePermiso('asistencias.registrarQR'), asistenciasController.registrarPorQR);
router.post('/codigo', authorizePermiso('asistencias.registrarCodigo'), asistenciasController.registrarPorCodigo);
router.post('/codigo-temporal', authorizePermiso('asistencias.generarCodigo'), asistenciasController.generarCodigoTemporal);
router.get('/sesion/:sesion_id', authorizePermiso('asistencias.listar'), asistenciasController.listarPorSesion);

module.exports = router;
