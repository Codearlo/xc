const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Archivo = sequelize.define('Archivo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tarea_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tareas',
      key: 'id'
    }
  }
}, {
  tableName: 'archivos',
  timestamps: true
});

module.exports = Archivo;