const express = require('express');
const ajaxController = require('../controllers/ajaxController');
const isAuthenticated = require('../middlewares/authMiddleware');

const router = express.Router();

// POST route to add a new trip
router.post('/add-trip',isAuthenticated,ajaxController.add_trip );
router.post('/add-expense',isAuthenticated,ajaxController.add_expense);
router.get('/add-advances',isAuthenticated,ajaxController.advances );


module.exports = router;
