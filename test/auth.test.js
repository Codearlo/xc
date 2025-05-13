const request = require('supertest');
const { app } = require('../src/app');
const { Usuario } = require('../src/models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Usuario de prueba
let testUser;
let authToken;

// Antes de todas las pruebas
beforeAll(async () => {
  // Crear un usuario de prueba en la base de datos
  const password = await bcrypt.hash('Test123456', 10);
  testUser = await Usuario.create({
    nombre: 'Usuario de Prueba',
    email: 'test@example.com',
    password: password,
    rol: 'miembro'
  });

  // Generar token JWT para el usuario de prueba
  authToken = jwt.sign(
    { id: testUser.id },
    process.env.JWT_SECRET || 'secret_key_sistema_colaborativo',
    { expiresIn: '1h' }
  );
});

// Después de todas las pruebas
afterAll(async () => {
  // Eliminar el usuario de prueba
  await testUser.destroy();
});

describe('Tests de autenticación', () => {
  // Test para login
  test('Debería permitir el login con credenciales correctas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test123456'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('nombre');
    expect(response.body.email).toBe('test@example.com');
  });

  // Test para login fallido
  test('Debería rechazar el login con credenciales incorrectas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'ContraseñaIncorrecta'
      });

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('error');
  });
});

describe('Tests de proyectos', () => {
  // Variable para guardar el ID de un proyecto creado
  let proyectoId;

  // Test para crear un proyecto
  test('Debería crear un nuevo proyecto', async () => {
    const response = await request(app)
      .post('/api/proyectos')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        titulo: 'Proyecto de prueba',
        descripcion: 'Descripción del proyecto de prueba'
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.titulo).toBe('Proyecto de prueba');
    
    // Guardar el ID para pruebas posteriores
    proyectoId = response.body.id;
  });

  // Test para obtener proyectos
  test('Debería obtener la lista de proyectos', async () => {
    const response = await request(app)
      .get('/api/proyectos')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('proyectos');
    expect(response.body).toHaveProperty('pagination');
    expect(Array.isArray(response.body.proyectos)).toBeTruthy();
  });

  // Test para obtener un proyecto específico
  test('Debería obtener un proyecto por ID', async () => {
    const response = await request(app)
      .get(`/api/proyectos/${proyectoId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body.id).toBe(proyectoId);
    expect(response.body.titulo).toBe('Proyecto de prueba');
  });
});