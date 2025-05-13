const express = require('express');
const { check } = require('express-validator');
const tareaController = require('../Controllers/tarea.controller');
const { auth } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(auth);

// Crear una nueva tarea (con posibilidad de adjuntar archivos)
router.post(
  '/',
  upload.array('archivos', 5), // Máximo 5 archivos
  [
    check('titulo').not().isEmpty().withMessage('El título es obligatorio'),
    check('descripcion').optional(),
    check('proyecto_id').isInt().withMessage('ID de proyecto inválido'),
    check('asignado_a').optional().isInt().withMessage('ID de usuario asignado inválido')
  ],
  tareaController.crearTarea
);

// Obtener tareas (con filtros)
router.get('/', tareaController.obtenerTareas);

// Actualizar el estado de una tarea
router.patch(
  '/:id/estado',
  [
    check('estado').isIn(['pendiente', 'en progreso', 'completada']).withMessage('Estado no válido')
  ],
  tareaController.actualizarEstadoTarea
);

module.exports = router;