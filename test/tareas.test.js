const request = require('supertest');
const { app } = require('../src/app');
const { Usuario, Proyecto, Tarea } = require('../src/models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Variables para las pruebas
let testUser;
let authToken;
let proyectoId;

// Antes de todas las pruebas
beforeAll(async () => {
  // Crear un usuario de prueba en la base de datos
  const password = await bcrypt.hash('Test123456', 10);
  testUser = await Usuario.create({
    nombre: 'Usuario de Prueba Tareas',
    email: 'testtareas@example.com',
    password: password,
    rol: 'miembro'
  });

  // Generar token JWT para el usuario de prueba
  authToken = jwt.sign(
    { id: testUser.id },
    process.env.JWT_SECRET || 'secret_key_sistema_colaborativo',
    { expiresIn: '1h' }
  );

  // Crear un proyecto de prueba
  const proyecto = await Proyecto.create({
    titulo: 'Proyecto para pruebas de tareas',
    descripcion: 'Descripción del proyecto para pruebas de tareas',
    usuario_id: testUser.id
  });
  
  proyectoId = proyecto.id;
});

// Después de todas las pruebas
afterAll(async () => {
  // Eliminar datos de prueba
  await Tarea.destroy({ where: { proyecto_id: proyectoId } });
  await Proyecto.destroy({ where: { id: proyectoId } });
  await testUser.destroy();
});

describe('Tests de tareas', () => {
  // Variable para guardar el ID de una tarea creada
  let tareaId;

  // Test para crear una tarea
  test('Debería crear una nueva tarea', async () => {
    const response = await request(app)
      .post('/api/tareas')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        titulo: 'Tarea de prueba',
        descripcion: 'Descripción de la tarea de prueba',
        proyecto_id: proyectoId
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.titulo).toBe('Tarea de prueba');
    
    // Guardar el ID para pruebas posteriores
    tareaId = response.body.id;
  });

  // Test para obtener tareas
  test('Debería obtener la lista de tareas', async () => {
    const response = await request(app)
      .get('/api/tareas')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('tareas');
    expect(response.body).toHaveProperty('pagination');
    expect(Array.isArray(response.body.tareas)).toBeTruthy();
  });

  // Test para obtener una tarea específica
  test('Debería obtener una tarea por ID', async () => {
    const response = await request(app)
      .get(`/api/tareas/${tareaId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body.id).toBe(tareaId);
    expect(response.body.titulo).toBe('Tarea de prueba');
  });

  // Test para actualizar el estado de una tarea
  test('Debería actualizar el estado de una tarea', async () => {
    const response = await request(app)
      .patch(`/api/tareas/${tareaId}/estado`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        estado: 'en progreso'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body.id).toBe(tareaId);
    expect(response.body.estado).toBe('en progreso');
  });

  // Test para filtrar tareas por estado
  test('Debería filtrar tareas por estado', async () => {
    const response = await request(app)
      .get('/api/tareas?estado=en progreso')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('tareas');
    expect(Array.isArray(response.body.tareas)).toBeTruthy();
    
    // Verificar que todas las tareas tienen el estado 'en progreso'
    response.body.tareas.forEach(tarea => {
      expect(tarea.estado).toBe('en progreso');
    });
  });

  // Test para filtrar tareas por proyecto
  test('Debería filtrar tareas por proyecto', async () => {
    const response = await request(app)
      .get(`/api/tareas?proyecto_id=${proyectoId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('tareas');
    expect(Array.isArray(response.body.tareas)).toBeTruthy();
    
    // Verificar que todas las tareas pertenecen al proyecto especificado
    response.body.tareas.forEach(tarea => {
      expect(tarea.proyecto_id).toBe(proyectoId);
    });
  });
});