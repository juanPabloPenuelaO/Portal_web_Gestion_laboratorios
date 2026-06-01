const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./models');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await db.sequelize.authenticate();
    res.json({ status: 'GILIH API corriendo OK', database: 'conectada' });
  } catch (error) {
    res.status(503).json({ status: 'GILIH API corriendo', database: 'desconectada', error: error.message });
  }
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/roles', require('./routes/roles.routes'));
app.use('/api/usuarios', require('./routes/usuarios.routes'));
app.use('/api/tipos-laboratorio', require('./routes/tipos-laboratorio.routes'));
app.use('/api/laboratorios', require('./routes/laboratorios.routes'));
app.use('/api/sesiones', require('./routes/sesiones.routes'));
app.use('/api/asistencias', require('./routes/asistencias.routes'));
app.use('/api/reservas', require('./routes/reservas.routes'));
app.use('/api/consultas', require('./routes/consultas.routes'));
app.use('/api/notificaciones', require('./routes/notificaciones.routes'));
app.use('/api/inventario', require('./routes/inventario.routes'));
app.use('/api/prestamos', require('./routes/prestamos.routes'));
app.use('/api/incidencias', require('./routes/incidencias.routes'));
app.use('/api/practicas', require('./routes/practicas.routes'));
app.use('/api/analitica', require('./routes/analitica.routes'));

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
