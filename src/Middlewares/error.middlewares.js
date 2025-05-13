// Middleware para manejo centralizado de errores
exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Errores de validación de Sequelize
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    
    return res.status(400).json({
      error: 'Error de validación',
      details: errors
    });
  }
  
  // Errores de Express Validator
  if (err.array && typeof err.array === 'function') {
    const errors = err.array();
    return res.status(400).json({
      error: 'Error de validación',
      details: errors
    });
  }
  
  // Error personalizado con código de estado
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message
    });
  }
  
  // Error genérico
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'production' ? 'Algo salió mal' : err.message
  });
};