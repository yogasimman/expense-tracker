const User = require('../models/userModel');
const Trip = require('../models/tripModel');
const Expense = require('../models/expenseModel');
const Category = require('../models/categoryModel');
const Reports = require('../models/reportsModel');
const Advances = require('../models/advancesModel');

exports.add_trip = async (req, res) => {
    try {
        console.log(req.body);  // Log the request body
        const { tripName, travelType, itinerary } = req.body;

        // Check if userId is present in the request body; if not, use session user ID
        let userId = req.body.userId || req.session.user.id;

        // Ensure userId is stored as an array, even if it's a single value
        if (!Array.isArray(userId)) {
            userId = [userId];  // Convert userId to an array
        }

        console.log('User ID:', userId); // Log userId before saving

        // Create a new Trip object using the Mongoose model
        const newTrip = new Trip({
            tripName,
            travelType,
            itinerary,
            userId: userId, // Assign the user ID array
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
        console.error('Error adding trip:', error); // Log the error
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

exports.advances = async (req, res) => {
    try {
        const userId = req.session.user.id; // Get the user ID from the session
        console.log('User ID:', userId); // Log the user ID
        
        // Check all trips for debugging
        const allTrips = await Trip.find({ userId: userId });
        console.log('All trips for user:', allTrips); // Log all trips for the user

        // Fetch only the tripName for the specified userId
        const trips = await Trip.find(
            { userId: { $in: [userId] } }, 
            { tripName: 1, _id: 1 } // Include _id for debugging
        );

        console.log('Fetched trips:', JSON.stringify(trips, null, 2)); // Log the fetched trips

        // Render the EJS view and pass trips
        res.render('advances', { currentPath: req.url, trips: trips });

    } catch (error) {
        console.error('Error fetching trips:', error); // Log any errors
        res.status(500).send('Server Error');
    }
};
