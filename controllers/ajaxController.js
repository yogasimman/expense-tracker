const User = require('../models/userModel');
const Trip = require('../models/tripModel');
const Expense = require('../models/expenseModel');
const Category = require('../models/categoryModel');
const Reports = require('../models/reportsModel');
const Advances = require('../models/advancesModel');

exports.add_trip = async (req, res) => {
    try {
        console.log(req.body);
        const { tripName, travelType, itinerary } = req.body;

        // Check if userId is present in the request body; if not, use session user ID
        const userId = req.body.userId || req.session.user._id;

        // Create a new Trip object using the Mongoose model
        const newTrip = new Trip({
            tripName,
            travelType,
            itinerary,
            userId: userId, // Assign the user ID
            status: 'pending' // Default status when creating a trip
        });

        // Save the trip to the database
        const savedTrip = await newTrip.save();

        // Return success response
        res.status(200).json({
            message: 'Trip added successfully',
            trip: savedTrip
        });
    } catch (error) {
        // Handle any errors during trip creation
        res.status(500).json({
            message: 'Error adding trip',
            error: error.message
        });
    }
};

exports.add_expense = async (req, res) => {
    try {
        const { userId, tripId, categoryId, expenseTitle, amount, currency, description, date } = req.body;
        
        // Check if files exist
        const receipts = req.body.receipts ? req.body.receipts : [];

        // Create a new expense
        const newExpense = new Expense({
            userId,
            tripId,
            categoryId,
            expenseTitle,
            amount,
            currency,
            description,
            date,
            receipts
        });

        // Save the expense
        await newExpense.save();

        res.status(200).json({ message: 'Expense added successfully!' });
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ message: 'Failed to add expense.' });
    }
};
