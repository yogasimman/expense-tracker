const express = require('express');
const router = express.Router();
const Advance = require('../models/advancesModel');
const Expense = require('../models/expenseModel');
const Trip = require('../models/tripModel');
const Report = require('../models/reportsModel');
const Category = require('../models/categoryModel');

// Route to render analytics page
router.get('/analytics', async (req, res) => {
    const userId = req.user._id;

    try {
        // Fetching Expenses by Category
        const expenses = await Expense.aggregate([
            { $match: { userId } },
            { $group: { _id: "$categoryId", totalAmount: { $sum: "$amount" } } },
        ]);
        
        const categories = await Category.find({ _id: { $in: expenses.map(e => e._id) } });
        const expenseCategories = categories.map(category => category.name);
        const expenseAmounts = expenses.map(e => e.totalAmount);

        // Fetching Trips Count by Travel Type
        const trips = await Trip.aggregate([
            { $match: { userId } },
            { $group: { _id: "$travelType", count: { $sum: 1 } } }
        ]);
        
        // Initialize tripCounts with defaults
        const tripCounts = trips.reduce((acc, trip) => {
            acc[trip._id] = trip.count; // Sets count for each travelType
            return acc;
        }, { local: 0, domestic: 0, international: 0 });

        // Fetching Advances by Currency
        const advances = await Advance.aggregate([
            { $match: { userId } },
            { $group: { _id: "$currency", totalAmount: { $sum: "$amount" } } }
        ]);
        const advanceAmounts = advances.map(a => a.totalAmount);

        // Fetching Reports Status
        const reports = await Report.aggregate([
            { $match: { userId } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        
        const reportStatuses = reports.reduce((acc, report) => {
            acc[report._id] = report.count; // Sets count for each report status
            return acc;
        }, { submitted: 0, approved: 0, rejected: 0 });

        // Render the analytics view
        res.render('analytics', {
            user: req.user,
            expenseCategories,
            expenseAmounts,
            tripCounts: Object.values(tripCounts), // Convert to array for EJS
            advanceAmounts,
            reportStatuses: Object.values(reportStatuses) // Convert to array for EJS
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error'); // Return a 500 error on failure
    }
});

module.exports = router;
