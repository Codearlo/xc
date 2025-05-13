const { Tarea, Proyecto, Archivo, Usuario } = require('../models');
const { validationResult } = require('express-validator');
const { Sequelize } = require('sequelize');
const path = require('path');

// Crear una nueva tarea
exports.crearTarea = async (req, res, next) => {
  try {
    // Validar errores
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { titulo, descripcion, proyecto_id, asignado_a } = req.body;

    // Verificar que el proyecto exista
    const proyecto = await Proyecto.findByPk(proyecto_id);
    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Crear la tarea
    const tarea = await Tarea.create({
      titulo,
      descripcion,
      proyecto_id,
      asignado_a: asignado_a || null
    });

    // Si hay archivos adjuntos, guardarlos
    if (req.files && req.files.length > 0) {
      const archivos = req.files.map(file => {
        return {
          nombre: file.originalname,
          url: `/uploads/${file.filename}`,
          tarea_id: tarea.id
        };
      });

      await Archivo.bulkCreate(archivos);
    }

    // Obtener la tarea creada con sus archivos
    const tareaConArchivos = await Tarea.findByPk(tarea.id, {
      include: [{ model: Archivo, as: 'archivos' }]
    });

    // Notificar a los miembros del proyecto sobre la nueva tarea
    const io = req.app.get('io');
    if (io) {
      io.to(`proyecto_${proyecto_id}`).emit('tarea_creada', {
        id: tarea.id,
        titulo: tarea.titulo,
        creadaPor: req.usuario.nombre
      });
    }

    res.status(201).json(tareaConArchivos);
  } catch (error) {
    console.error('Error al crear tarea:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Obtener tareas con filtros
exports.obtenerTareas = async (req, res, next) => {
  try {
    const { estado, proyecto_id, asignado_a } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Crear condiciones de filtrado
    const whereCondition = {};
    
    if (estado) {
      whereCondition.estado = estado;
    }
    
    if (proyecto_id) {
      whereCondition.proyecto_id = proyecto_id;
    }
    
    if (asignado_a) {
      whereCondition.asignado_a = asignado_a;
    }

    // Obtener las tareas
    const tareas = await Tarea.findAll({
      where: whereCondition,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Usuario, as: 'asignado', attributes: ['id', 'nombre'] },
        { model: Archivo, as: 'archivos' }
      ]
    });

    const total = await Tarea.count({ where: whereCondition });

    // Calcular información de paginación
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      tareas,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Actualizar el estado de una tarea
exports.actualizarEstadoTarea = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    // Validar estado
    const estadosValidos = ['pendiente', 'en progreso', 'completada'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    // Buscar la tarea
    const tarea = await Tarea.findByPk(id, {
      include: [{ model: Proyecto, as: 'proyecto' }]
    });

    if (!tarea) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    // Actualizar estado
    const estadoAnterior = tarea.estado;
    tarea.estado = estado;
    await tarea.save();

    // Emitir evento a través de Socket.io para notificar en tiempo real
    const io = req.app.get('io');
    if (io) {
      // Notificar a todos los usuarios del proyecto
      io.to(`proyecto_${tarea.proyecto_id}`).emit('tarea_actualizada', {
        id: tarea.id,
        titulo: tarea.titulo,
        estadoAnterior,
        estadoNuevo: estado,
        actualizadoPor: req.usuario.nombre
      });
    }

    res.json(tarea);
  } catch (error) {
    console.error('Error al actualizar estado de tarea:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Obtener detalle de una tarea
exports.obtenerTareaPorId = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tarea = await Tarea.findByPk(id, {
      include: [
        { model: Usuario, as: 'asignado', attributes: ['id', 'nombre'] },
        { model: Archivo, as: 'archivos' },
        { model: Proyecto, as: 'proyecto', attributes: ['id', 'titulo'] }
      ]
    });

    if (!tarea) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    res.json(tarea);
  } catch (error) {
    console.error('Error al obtener tarea por ID:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};