const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const setupSockets = require('./sockets/sockets');
require('dotenv').config();

// Importar middlewares
const { responseFormat } = require('./middlewares/response.middleware');
const { errorHandler } = require('./middlewares/error.middleware');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const proyectoRoutes = require('./routes/proyecto.routes');
const tareaRoutes = require('./routes/tarea.routes');

// Crear la aplicación Express
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configurar sockets
setupSockets(io);

// Hacer que io esté disponible en req.app.get('io')
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseFormat); // Middleware para formatear respuestas (JSON/XML)

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas API
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/proyectos', proyectoRoutes);
app.use('/api/tareas', tareaRoutes);

// Manejo de errores
app.use(errorHandler);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Puerto
const PORT = process.env.PORT || 3000;

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Servidor funcionando en el puerto ${PORT}`);
});

module.exports = { app, server, io };