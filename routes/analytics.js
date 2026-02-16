const express = require('express');
const router = express.Router();
const AnalyticsHelper = require('../controllers/analyticsHelper');
const isAuthenticated = require('../middlewares/authMiddleware');

// API route for analytics data (JSON)
router.get('/data', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
    const isAdmin = req.session.user.role === 'admin';

    try {
        const expenses = await AnalyticsHelper.getUserExpensesByCategory(userId);
        const tripCounts = await AnalyticsHelper.getUserTripsByType(userId);
        const advances = await AnalyticsHelper.getUserAdvancesByCurrency(userId);

        const result = {
            expenseCategories: expenses.map(e => e.name),
            expenseAmounts: expenses.map(e => parseFloat(e.total_amount)),
            tripCounts: [tripCounts.local, tripCounts.domestic, tripCounts.international],
            advanceLabels: advances.map(a => a.currency),
            advanceAmounts: advances.map(a => parseFloat(a.total_amount))
        };

        if (isAdmin) {
            const overallExpenses = await AnalyticsHelper.getOverallExpensesByCategory();
            const overallTripCounts = await AnalyticsHelper.getOverallTripsByType();
            const overallAdvances = await AnalyticsHelper.getOverallAdvancesByCurrency();

            result.overall = {
                expenseCategories: overallExpenses.map(e => e.name),
                expenseAmounts: overallExpenses.map(e => parseFloat(e.total_amount)),
                tripCounts: [overallTripCounts.local, overallTripCounts.domestic, overallTripCounts.international],
                advanceLabels: overallAdvances.map(a => a.currency),
                advanceAmounts: overallAdvances.map(a => parseFloat(a.total_amount))
            };
        }

        res.json(result);
    } catch (err) {
        console.error('Analytics error:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
