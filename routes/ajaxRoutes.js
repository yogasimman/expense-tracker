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

// Approval workflow routes
router.get('/trip-details/:tripId', isAuthenticated, ajaxController.getTripDetails);
router.post('/approve-expenses', isAuthenticated, ajaxController.approveExpenses);
router.post('/reject-expense', isAuthenticated, ajaxController.rejectExpense);
router.post('/approve-advances', isAuthenticated, ajaxController.approveAdvances);
router.post('/reject-advance', isAuthenticated, ajaxController.rejectAdvance);
router.post('/finish-trip', isAuthenticated, ajaxController.finishTrip);

module.exports = router;
