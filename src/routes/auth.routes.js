const express = require('express');
const { check } = require('express-validator');
const authController = require('../Controllers/auth.controller');
const { auth, checkRole } = require('../middlewares/auth.middleware');

const router = express.Router();

// Validaciones comunes
const emailValidator = check('email')
  .isEmail()
  .withMessage('Ingrese un email válido');

const passwordValidator = check('password')
  .isLength({ min: 8 })
  .withMessage('La contraseña debe tener al menos 8 caracteres')
  .matches(/[A-Z]/)
  .withMessage('La contraseña debe incluir al menos una letra mayúscula')
  .matches(/[0-9]/)
  .withMessage('La contraseña debe incluir al menos un número');

// Ruta para registro sin autenticación (usuarios nuevos)
router.post(
  '/registro',
  [
    check('nombre').not().isEmpty().withMessage('El nombre es obligatorio'),
    emailValidator,
    passwordValidator
  ],
  authController.register
);

// Ruta para login
router.post(
  '/login',
  [
    emailValidator,
    check('password').not().isEmpty().withMessage('La contraseña es obligatoria')
  ],
  authController.login
);

module.exports = router;