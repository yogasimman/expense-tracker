const express = require('express');
const router = express.Router();
const Trip = require('../models/tripModel');  // Assuming you have a Trip model
const Report = require('../models/reportModel');  // Assuming you have a Report model

// POST route to handle status update
router.post('/update-status', async (req, res) => {
    const { id, status } = req.body;

    try {
        let updatedRecord;

        // First, check if it's a Trip or a Report and update accordingly
        if (await Trip.exists({ _id: id })) {
            updatedRecord = await Trip.findByIdAndUpdate(id, { status: status }, { new: true });
        } else if (await Report.exists({ _id: id })) {
            updatedRecord = await Report.findByIdAndUpdate(id, { status: status }, { new: true });
        }

        // Send success response
        if (updatedRecord) {
            res.json({ success: true, updatedRecord });
        } else {
            res.json({ success: false, message: 'Record not found' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
