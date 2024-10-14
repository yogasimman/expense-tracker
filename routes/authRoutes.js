const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const isAuthenticated = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/login', authController.loginPage);

router.post('/login', [
    body('email', 'Please enter a valid email').isEmail(),
    body('password', 'Password is required').notEmpty()
], authController.login);

router.get('/logout', authController.logout);

router.get('/dashboard', isAuthenticated, authController.dashboardPage);

module.exports = router;
