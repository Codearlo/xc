const express = require('express');
const { check } = require('express-validator');
const proyectoController = require('../Controllers/proyecto.controller');
const { auth, checkRole } = require('../middlewares/auth.middleware');

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(auth);

// Crear un nuevo proyecto
router.post(
  '/',
  [
    check('titulo').not().isEmpty().withMessage('El título es obligatorio'),
    check('descripcion').optional()
  ],
  proyectoController.crearProyecto
);

// Obtener todos los proyectos (con paginación)
router.get('/', proyectoController.obtenerProyectos);

// Obtener un proyecto por ID
router.get('/:id', proyectoController.obtenerProyectoPorId);

// Invitar a un usuario a un proyecto
router.post(
  '/:id/invitar',
  [
    check('usuarioId').isInt().withMessage('ID de usuario inválido')
  ],
  proyectoController.invitarUsuario
);

// Eliminar un proyecto (solo admin o creador)
router.delete('/:id', proyectoController.eliminarProyecto);

module.exports = router;