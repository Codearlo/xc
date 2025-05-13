const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

// Middleware para verificar el token JWT
exports.auth = async (req, res, next) => {
  try {
    // Obtener el token del header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No autorizado. Token no proporcionado' });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar el usuario en la base de datos
    const usuario = await Usuario.findByPk(decoded.id);
    
    if (!usuario) {
      return res.status(401).json({ error: 'No autorizado. Usuario no encontrado' });
    }
    
    // Agregar el usuario al objeto request
    req.usuario = usuario;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'No autorizado. Token inválido' });
  }
};

// Middleware para verificar roles
exports.checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'No autorizado. Usuario no autenticado' });
    }
    
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'Prohibido. No tiene permisos para esta acción' });
    }
    
    next();
  };
};