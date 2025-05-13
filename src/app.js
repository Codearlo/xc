const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Crear la aplicación Express
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas básicas
app.get('/', (req, res) => {
  res.send('API Sistema Colaborativo - Servidor funcionando correctamente');
});

// --- Rutas de Auth ---
app.post('/api/auth/registro', (req, res) => {
  const { nombre, email, password, rol } = req.body;
  res.status(201).json({
    id: 1,
    nombre: nombre || 'Usuario Ejemplo',
    email: email || 'usuario@ejemplo.com',
    rol: rol || 'miembro',
    token: 'token-de-ejemplo'
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  res.json({
    id: 1,
    nombre: 'Usuario Ejemplo',
    email: email || 'usuario@ejemplo.com',
    rol: 'miembro',
    token: 'token-de-ejemplo'
  });
});

// --- Rutas de Proyectos ---
let proyectos = [
  { id: 1, titulo: 'Proyecto Ejemplo 1', descripcion: 'Descripción de ejemplo', usuario_id: 1 },
  { id: 2, titulo: 'Proyecto Ejemplo 2', descripcion: 'Otra descripción', usuario_id: 1 }
];

app.get('/api/proyectos', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  res.json({
    proyectos,
    pagination: {
      total: proyectos.length,
      totalPages: 1,
      currentPage: page,
      hasNextPage: false,
      hasPrevPage: false
    }
  });
});

app.post('/api/proyectos', (req, res) => {
  const { titulo, descripcion } = req.body;
  const nuevoProyecto = {
    id: proyectos.length + 1,
    titulo,
    descripcion,
    usuario_id: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  proyectos.push(nuevoProyecto);
  res.status(201).json(nuevoProyecto);
});

app.get('/api/proyectos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const proyecto = proyectos.find(p => p.id === id);
  
  if (!proyecto) {
    return res.status(404).json({ error: 'Proyecto no encontrado' });
  }
  
  res.json(proyecto);
});

app.post('/api/proyectos/:id/invitar', (req, res) => {
  const id = parseInt(req.params.id);
  const { usuarioId } = req.body;
  
  const proyecto = proyectos.find(p => p.id === id);
  if (!proyecto) {
    return res.status(404).json({ error: 'Proyecto no encontrado' });
  }
  
  res.status(201).json({ mensaje: 'Usuario invitado correctamente' });
});

app.delete('/api/proyectos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  proyectos = proyectos.filter(p => p.id !== id);
  
  res.json({ mensaje: 'Proyecto eliminado correctamente' });
});

// --- Rutas de Tareas ---
let tareas = [
  { id: 1, titulo: 'Tarea Ejemplo 1', descripcion: 'Descripción de tarea', estado: 'pendiente', proyecto_id: 1, asignado_a: null },
  { id: 2, titulo: 'Tarea Ejemplo 2', descripcion: 'Otra tarea', estado: 'en progreso', proyecto_id: 1, asignado_a: 1 }
];

app.get('/api/tareas', (req, res) => {
  const { estado, proyecto_id, asignado_a } = req.query;
  let tareasFiltradas = [...tareas];
  
  if (estado) {
    tareasFiltradas = tareasFiltradas.filter(t => t.estado === estado);
  }
  
  if (proyecto_id) {
    tareasFiltradas = tareasFiltradas.filter(t => t.proyecto_id === parseInt(proyecto_id));
  }
  
  if (asignado_a) {
    tareasFiltradas = tareasFiltradas.filter(t => t.asignado_a === parseInt(asignado_a));
  }
  
  res.json({
    tareas: tareasFiltradas,
    pagination: {
      total: tareasFiltradas.length,
      totalPages: 1,
      currentPage: 1,
      hasNextPage: false,
      hasPrevPage: false
    }
  });
});

app.post('/api/tareas', (req, res) => {
  const { titulo, descripcion, proyecto_id, asignado_a } = req.body;
  const nuevaTarea = {
    id: tareas.length + 1,
    titulo,
    descripcion,
    estado: 'pendiente',
    proyecto_id: parseInt(proyecto_id) || 1,
    asignado_a: asignado_a ? parseInt(asignado_a) : null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  tareas.push(nuevaTarea);
  res.status(201).json(nuevaTarea);
});

app.patch('/api/tareas/:id/estado', (req, res) => {
  const id = parseInt(req.params.id);
  const { estado } = req.body;
  
  const tarea = tareas.find(t => t.id === id);
  if (!tarea) {
    return res.status(404).json({ error: 'Tarea no encontrada' });
  }
  
  if (!['pendiente', 'en progreso', 'completada'].includes(estado)) {
    return res.status(400).json({ error: 'Estado no válido' });
  }
  
  tarea.estado = estado;
  tarea.updatedAt = new Date();
  
  res.json(tarea);
});

// WebSocket básico
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

// Manejo básico de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('¡Algo salió mal!');
});

// Puerto
const PORT = process.env.PORT || 3000;

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Servidor funcionando en el puerto ${PORT}`);
});

module.exports = { app, server, io };