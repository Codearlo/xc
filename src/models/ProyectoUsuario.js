const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProyectoUsuario = sequelize.define('ProyectoUsuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  proyecto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'proyectos',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'proyecto_usuarios',
  timestamps: true
});

module.exports = ProyectoUsuario;