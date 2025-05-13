const sequelize = require('./config/database');
const { Usuario } = require('./models');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Verificar si el archivo de base de datos SQLite existe
const dbPath = path.join(__dirname, '../database.sqlite');
if (fs.existsSync(dbPath)) {
  console.log('Base de datos SQLite encontrada en:', dbPath);
} else {
  console.log('Creando nueva base de datos SQLite en:', dbPath);
}

async function syncDatabase() {
  try {
    // Crear directorios necesarios si no existen
    const directories = ['./config', './controllers', './middlewares', './models', './routes', './sockets'];
    directories.forEach(dir => {
      if (!fs.existsSync(path.join(__dirname, dir))) {
        fs.mkdirSync(path.join(__dirname, dir), { recursive: true });
        console.log(`Directorio creado: ${dir}`);
      }
    });

    // Asegurarse de que el directorio de uploads existe
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Directorio de uploads creado');
    }

    // Sincronizar todos los modelos con la base de datos
    console.log('Sincronizando modelos con la base de datos...');
    await sequelize.sync({ force: true });
    console.log('Base de datos sincronizada correctamente');

    // Crear usuario administrador por defecto
    console.log('Creando usuario administrador...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin123', salt);
    
    await Usuario.create({
      nombre: 'Administrador',
      email: 'admin@example.com',
      password: hashedPassword,
      rol: 'admin'
    });
    
    console.log('Usuario administrador creado (admin@example.com / Admin123)');

    // Crear usuario miembro por defecto
    console.log('Creando usuario miembro...');
    const userHashedPassword = await bcrypt.hash('Usuario123', salt);
    
    await Usuario.create({
      nombre: 'Usuario Regular',
      email: 'usuario@example.com',
      password: userHashedPassword,
      rol: 'miembro'
    });
    
    console.log('Usuario miembro creado (usuario@example.com / Usuario123)');
    console.log('Inicialización completada con éxito');
    
  } catch (error) {
    console.error('Error al sincronizar la base de datos:', error);
  } finally {
    process.exit(0);
  }
}

// Asegurarse de que los archivos básicos existan antes de sincronizar
const requiredFiles = [
  { path: './config/database.js', exists: false },
  { path: './models/index.js', exists: false },
  { path: './models/Usuario.js', exists: false }
];

// Verificar y crear archivos básicos necesarios
for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file.path);
  if (!fs.existsSync(filePath)) {
    console.log(`Archivo requerido no encontrado: ${file.path}`);
    
    // Crear directorios necesarios
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Crear archivos básicos con contenido mínimo
    if (file.path === './config/database.js') {
      fs.writeFileSync(filePath, `
const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Configuración para SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: false
});

module.exports = sequelize;
      `);
      console.log('Archivo de configuración de base de datos creado');
    } 
    else if (file.path === './models/Usuario.js') {
      fs.writeFileSync(filePath, `
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rol: {
    type: DataTypes.STRING,
    defaultValue: 'miembro'
  }
}, {
  tableName: 'usuarios',
  timestamps: true
});

// Método para comparar contraseñas
Usuario.prototype.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = Usuario;
      `);
      console.log('Modelo de Usuario creado');
    }
    else if (file.path === './models/index.js') {
      fs.writeFileSync(filePath, `
const Usuario = require('./Usuario');

module.exports = {
  Usuario
};
      `);
      console.log('Archivo index de modelos creado');
    }
  }
}

// Verificar si existe el archivo .env
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.log('Archivo .env no encontrado, creando uno básico...');
  fs.writeFileSync(envPath, `
PORT=3000
JWT_SECRET=secret_key_sistema_colaborativo
JWT_EXPIRES_IN=2h
UPLOADS_DIR=./uploads
  `);
  console.log('Archivo .env creado con configuración básica');
}

// Iniciar sincronización
console.log('Iniciando sincronización de la base de datos...');
syncDatabase();