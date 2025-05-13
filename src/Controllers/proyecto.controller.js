const { Proyecto, Usuario, ProyectoUsuario } = require('../models');
const { Sequelize } = require('sequelize');
const { validationResult } = require('express-validator');

// Crear un nuevo proyecto
exports.crearProyecto = async (req, res, next) => {
  try {
    // Validar errores
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { titulo, descripcion } = req.body;
    const usuario_id = req.usuario?.id || 1; // Fallback para pruebas

    // Crear el proyecto
    const proyecto = await Proyecto.create({
      titulo,
      descripcion,
      usuario_id
    });

    // Añadir al creador como colaborador también
    await ProyectoUsuario.create({
      proyecto_id: proyecto.id,
      usuario_id
    });

    res.status(201).json(proyecto);
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Obtener todos los proyectos (con paginación)
exports.obtenerProyectos = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Obtener los proyectos (simplificado para iniciar)
    const proyectos = await Proyecto.findAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    const total = await Proyecto.count();

    // Calcular información de paginación
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      proyectos,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Obtener un proyecto por ID
exports.obtenerProyectoPorId = async (req, res, next) => {
  try {
    const { id } = req.params;

    const proyecto = await Proyecto.findByPk(id);

    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    res.json(proyecto);
  } catch (error) {
    console.error('Error al obtener proyecto por ID:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Invitar a un usuario a un proyecto
exports.invitarUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { usuarioId } = req.body;

    // Verificar que el proyecto exista
    const proyecto = await Proyecto.findByPk(id);
    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Verificar que el usuario a invitar exista
    const usuarioInvitado = await Usuario.findByPk(usuarioId);
    if (!usuarioInvitado) {
      return res.status(404).json({ error: 'Usuario a invitar no encontrado' });
    }

    // Añadir el usuario como colaborador
    await ProyectoUsuario.create({
      proyecto_id: id,
      usuario_id: usuarioId
    });

    res.status(201).json({ mensaje: 'Usuario invitado correctamente' });
  } catch (error) {
    console.error('Error al invitar usuario:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Eliminar un proyecto
exports.eliminarProyecto = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que el proyecto exista
    const proyecto = await Proyecto.findByPk(id);
    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Eliminar el proyecto
    await proyecto.destroy();

    res.json({ mensaje: 'Proyecto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};