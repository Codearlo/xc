// Importar modelos
const Usuario = require('./Usuario');
const Proyecto = require('./Proyecto');
const Tarea = require('./Tarea');
const Archivo = require('./Archivo');
const ProyectoUsuario = require('./ProyectoUsuario');

// Relaciones entre los modelos

// Relación Usuario - Proyecto (Creador)
Usuario.hasMany(Proyecto, { foreignKey: 'usuario_id', as: 'proyectosCreados' });
Proyecto.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'creador' });

// Relación Usuario - Tarea (Asignado)
Usuario.hasMany(Tarea, { foreignKey: 'asignado_a', as: 'tareasAsignadas' });
Tarea.belongsTo(Usuario, { foreignKey: 'asignado_a', as: 'asignado' });

// Relación Proyecto - Tarea
Proyecto.hasMany(Tarea, { foreignKey: 'proyecto_id', as: 'tareas' });
Tarea.belongsTo(Proyecto, { foreignKey: 'proyecto_id', as: 'proyecto' });

// Relación Tarea - Archivo
Tarea.hasMany(Archivo, { foreignKey: 'tarea_id', as: 'archivos' });
Archivo.belongsTo(Tarea, { foreignKey: 'tarea_id', as: 'tarea' });

// Relación muchos a muchos entre Proyecto y Usuario (Colaboradores)
Proyecto.belongsToMany(Usuario, { 
  through: ProyectoUsuario,
  foreignKey: 'proyecto_id',
  otherKey: 'usuario_id',
  as: 'colaboradores'
});

Usuario.belongsToMany(Proyecto, { 
  through: ProyectoUsuario,
  foreignKey: 'usuario_id',
  otherKey: 'proyecto_id',
  as: 'proyectosColaborando'
});

module.exports = {
  Usuario,
  Proyecto,
  Tarea,
  Archivo,
  ProyectoUsuario
};