const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const pageController = require('../controllers/pageController');
const isAuthenticated = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/',authController.index);

router.get('/login', authController.loginPage);

router.post('/login', [
    body('email', 'Please enter a valid email').isEmail(),
    body('password', 'Password is required').notEmpty()
], authController.login);

router.get('/logout', authController.logout);

router.get('/dashboard', isAuthenticated, authController.dashboardPage);

router.get('/settings', isAuthenticated, pageController.settings);

router.get('/trips',isAuthenticated,pageController.trips);

router.get('/expenses',isAuthenticated,pageController.expenses);

router.get('/advances',isAuthenticated,pageController.advances);

router.get('/approvals',isAuthenticated,pageController.approvals);

module.exports = router;
