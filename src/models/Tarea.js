const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tarea = sequelize.define('Tarea', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'en progreso', 'completada'),
    defaultValue: 'pendiente'
  },
  proyecto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'proyectos',
      key: 'id'
    }
  },
  asignado_a: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  }
}, {
  tableName: 'tareas',
  timestamps: true
});

module.exports = Tarea;