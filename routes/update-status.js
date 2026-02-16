const express = require('express');
const router = express.Router();
const Trip = require('../models/tripModel');
const Report = require('../models/reportsModel');
const isAuthenticated = require('../middlewares/authMiddleware');

// POST route to handle status update for trips
router.post('/update-trip-status', isAuthenticated, async (req, res) => {
    const { id, status } = req.body;

    if (!id || !status) {
        return res.status(400).json({ success: false, message: 'ID and status are required' });
    }

    try {
        const updatedTrip = await Trip.updateStatus(id, status);
        if (updatedTrip) {
            res.json({ success: true, updatedRecord: updatedTrip });
        } else {
            res.status(404).json({ success: false, message: 'Trip not found' });
        }
    } catch (error) {
        console.error('Error updating trip status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST route to handle status update for reports
router.post('/update-report-status', isAuthenticated, async (req, res) => {
    const { id, status, message } = req.body;

    if (!id || !status) {
        return res.status(400).json({ success: false, message: 'ID and status are required' });
    }

    try {
        const updatedReport = await Report.updateStatus(id, status, message);
        if (updatedReport) {
            res.json({ success: true, updatedRecord: updatedReport });
        } else {
            res.status(404).json({ success: false, message: 'Report not found' });
        }
    } catch (error) {
        console.error('Error updating report status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
