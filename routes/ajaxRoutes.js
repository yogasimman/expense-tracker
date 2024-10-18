const express = require('express');
const ajaxController = require('../controllers/ajaxController');
const isAuthenticated = require('../middlewares/authMiddleware');

const router = express.Router();

// POST route to add a new trip
router.post('/add-trip',isAuthenticated,ajaxController.add_trip );
router.post('/add-expense',isAuthenticated,ajaxController.add_expense);
router.get('/add-advances',isAuthenticated,ajaxController.advances );

router.get('/category',isAuthenticated, ajaxController.get_category);
router.post('/category',isAuthenticated,ajaxController.post_category);
router.delete('/category',isAuthenticated,ajaxController.delete_category);

router.post('/advances',isAuthenticated,ajaxController.addAdvances);
router.post('/add-report',isAuthenticated,ajaxController.addReport);

module.exports = router;
