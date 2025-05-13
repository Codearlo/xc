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
    const usuario_id = req.usuario?.id;

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
    const usuario_id = req.usuario?.id;

    // Obtener los proyectos donde el usuario es colaborador o creador
    const proyectos = await Proyecto.findAll({
      include: [
        {
          model: Usuario,
          as: 'colaboradores',
          attributes: ['id', 'nombre', 'email'],
          through: { attributes: [] }
        }
      ],
      where: {
        [Sequelize.Op.or]: [
          { usuario_id }, // Es el creador
          {
            '$colaboradores.id$': usuario_id // Es colaborador
          }
        ]
      },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    // Contar el total
    const total = await Proyecto.count({
      include: [
        {
          model: Usuario,
          as: 'colaboradores',
          attributes: [],
          through: { attributes: [] }
        }
      ],
      where: {
        [Sequelize.Op.or]: [
          { usuario_id },
          {
            '$colaboradores.id$': usuario_id
          }
        ]
      },
      distinct: true
    });

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
    const usuario_id = req.usuario?.id;

    const proyecto = await Proyecto.findByPk(id, {
      include: [
        {
          model: Usuario,
          as: 'colaboradores',
          attributes: ['id', 'nombre', 'email'],
          through: { attributes: [] }
        }
      ]
    });

    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Verificar si el usuario es colaborador o creador
    const esColaborador = proyecto.colaboradores.some(col => col.id === usuario_id);
    if (proyecto.usuario_id !== usuario_id && !esColaborador) {
      return res.status(403).json({ error: 'No tienes permisos para ver este proyecto' });
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
    const usuario_id = req.usuario?.id;

    // Verificar que el proyecto exista
    const proyecto = await Proyecto.findByPk(id);
    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Verificar que el usuario solicitante sea el creador o un colaborador
    if (proyecto.usuario_id !== usuario_id) {
      const esColaborador = await ProyectoUsuario.findOne({
        where: {
          proyecto_id: id,
          usuario_id
        }
      });
      
      if (!esColaborador) {
        return res.status(403).json({ error: 'No tienes permisos para invitar usuarios a este proyecto' });
      }
    }

    // Verificar que el usuario a invitar exista
    const usuarioInvitado = await Usuario.findByPk(usuarioId);
    if (!usuarioInvitado) {
      return res.status(404).json({ error: 'Usuario a invitar no encontrado' });
    }

    // Verificar si el usuario ya es colaborador
    const yaEsColaborador = await ProyectoUsuario.findOne({
      where: {
        proyecto_id: id,
        usuario_id: usuarioId
      }
    });

    if (yaEsColaborador) {
      return res.status(400).json({ error: 'El usuario ya es colaborador de este proyecto' });
    }

    // Añadir el usuario como colaborador
    await ProyectoUsuario.create({
      proyecto_id: id,
      usuario_id: usuarioId
    });

    // Emitir evento a través de Socket.io para notificar en tiempo real
    const io = req.app.get('io');
    if (io) {
      // Notificar al usuario invitado
      io.to(`user_${usuarioId}`).emit('invitacion_proyecto', {
        proyecto_id: id,
        proyecto_titulo: proyecto.titulo,
        invitadoPor: req.usuario.nombre
      });
    }

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
    const usuario_id = req.usuario?.id;

    // Verificar que el proyecto exista
    const proyecto = await Proyecto.findByPk(id);
    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Verificar que el usuario sea el creador o un administrador
    if (proyecto.usuario_id !== usuario_id && req.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este proyecto' });
    }

    // Eliminar el proyecto
    await proyecto.destroy();

    // Notificar a los colaboradores
    const io = req.app.get('io');
    if (io) {
      io.to(`proyecto_${id}`).emit('proyecto_eliminado', {
        proyecto_id: id,
        proyecto_titulo: proyecto.titulo,
        eliminadoPor: req.usuario.nombre
      });
    }

    res.json({ mensaje: 'Proyecto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};