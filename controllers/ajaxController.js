const User = require('../models/userModel');
const Trip = require('../models/tripModel');
const Expense = require('../models/expenseModel');
const Category = require('../models/categoryModel');
const Reports = require('../models/reportsModel');
const Advance = require('../models/advancesModel');

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

exports.get_category = async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories); // Send the categories as JSON
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Error fetching categories', error });
    }
}

exports.post_category = async (req, res) => {
    const { name } = req.body;
    try {
        const newCategory = new Category({ name });
        await newCategory.save();
        res.status(201).json(newCategory); // Return the created category
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(400).json({ message: 'Error adding category', error });
    }
}

exports.delete_category = async (req, res) => {
    const { id } = req.body; // Make sure to send the category ID in the body
    try {
        const deletedCategory = await Category.findByIdAndDelete(id);
        if (!deletedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json({ message: 'Category removed successfully' });
    } catch (error) {
        console.error('Error removing category:', error);
        res.status(400).json({ message: 'Error removing category', error });
    }
}

exports.addExpense = async (req, res) => {
    try {
        const {
            userId,
            tripId,
            categoryId,
            expenseTitle,
            amount,
            currency,
            description,
            date,
            receipts // Expecting an array of base64 strings or images
        } = req.body;

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

        await newExpense.save();
        res.status(201).json({ message: 'Expense added successfully', expense: newExpense });
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ message: 'Error adding expense', error });
    }
};

exports.addAdvances = async (req, res) => {
    try {
        // Get form data from the request body
        const { userId, tripId, amount, currency, paidThrough, reference, notes } = req.body;

        // Validate required fields (you can extend this with more validation as needed)
        if (!userId || !tripId || !amount || !currency || !paidThrough) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Create a new advance record
        const newAdvance = new Advance({
            userId,
            tripId,
            amount,
            currency,
            paidThrough,
            referenceId: reference,
            notes
        });

        // Save the advance to the database
        await newAdvance.save();

        // Send a success response to the client
        res.status(200).json({ success: true, message: 'Advance recorded successfully', advance: newAdvance });
    } catch (error) {
        console.error('Error recording advance:', error);
        res.status(500).json({ success: false, message: 'An error occurred while recording the advance' });
    }
}

exports.addReport = async (req, res) => {
    try {
        const { reportName, businessPurpose, tripId, duration } = req.body;
        // Add your logic to create a report
        
        const newReport = new Reports({
            userId: req.session.user.id,
            tripId,
            reportName,
            businessPurpose,
            duration,
        });

        await newReport.save();
        res.json({ success: true, message: 'Report added successfully' }); // Return a JSON response
    } catch (error) {
        console.error('Error adding report:', error);
        res.status(500).json({ success: false, message: 'Failed to add report' }); // Ensure JSON response on error
    }
}