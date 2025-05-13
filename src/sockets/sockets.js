const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

module.exports = (io) => {
  // Middleware para autenticación de WebSockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('No autorizado. Token no proporcionado'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const usuario = await Usuario.findByPk(decoded.id);
      
      if (!usuario) {
        return next(new Error('No autorizado. Usuario no encontrado'));
      }
      
      // Guardar el usuario en el socket para usarlo más tarde
      socket.usuario = usuario;
      next();
    } catch (error) {
      next(new Error('No autorizado. Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.usuario.id}`);
    
    // Unir al usuario a su sala personal (para recibir notificaciones)
    socket.join(`user_${socket.usuario.id}`);
    
    // Evento para unirse a sala de proyecto
    socket.on('join_proyecto', (proyectoId) => {
      socket.join(`proyecto_${proyectoId}`);
      console.log(`${socket.usuario.nombre} se unió a proyecto_${proyectoId}`);
    });
    
    // Evento para abandonar sala de proyecto
    socket.on('leave_proyecto', (proyectoId) => {
      socket.leave(`proyecto_${proyectoId}`);
      console.log(`${socket.usuario.nombre} abandonó proyecto_${proyectoId}`);
    });
    
    // Evento de desconexión
    socket.on('disconnect', () => {
      console.log(`Usuario desconectado: ${socket.usuario.id}`);
    });
  });
  
  // Guardar la instancia de io en el app para usarla en controladores
  io.app = io;
  
  return io;
};