const User = require('../models/userModel');
const Trip = require('../models/tripModel');
const Expense = require('../models/expenseModel');
const Category = require('../models/categoryModel');
const Reports = require('../models/reportsModel');
const Advance = require('../models/advancesModel');

exports.add_trip = async (req, res) => {
    try {
        console.log(req.body);
        const { tripName, travelType, itinerary } = req.body;

        // Check if userId is present in the request body; if not, use session user ID
        let userId = req.body.userId || req.session.user.id;

        // Ensure userId is stored as an array, even if it's a single value
        if (!Array.isArray(userId)) {
            userId = [userId];
        }

        console.log('User ID:', userId);

        // Create trip using PostgreSQL model
        const savedTrip = await Trip.create({
            tripName,
            travelType,
            itinerary,
            userId: userId,
            status: 'pending'
        });

        // Return success response
        res.status(200).json({
            message: 'Trip added successfully',
            trip: savedTrip
        });
    } catch (error) {
        console.error('Error adding trip:', error);
        res.status(500).json({
            message: 'Error adding trip',
            error: error.message
        });
    }
};



exports.add_expense = async (req, res) => {
    try {
        const { tripId, categoryId, expenseTitle, amount, currency, description, date } = req.body;
        
        // Use session user ID as fallback
        const userId = req.body.userId || req.session.user.id;
        
        // Validate required fields
        if (!userId || !tripId || tripId === 'Select') {
            return res.status(400).json({ message: 'User and Trip are required.' });
        }
        if (!categoryId || categoryId === '' || categoryId === 'Select') {
            return res.status(400).json({ message: 'Category is required.' });
        }
        if (!expenseTitle || !amount) {
            return res.status(400).json({ message: 'Expense title and amount are required.' });
        }
        if (!currency || currency === 'Select') {
            return res.status(400).json({ message: 'Currency is required.' });
        }

        // Check trip status - must be approved and not finished
        const trip = await Trip.findById(parseInt(tripId));
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found.' });
        }
        if (trip.status !== 'approved') {
            return res.status(400).json({ 
                message: `Cannot add expenses to ${trip.status} trip. Trip must be approved first.`,
                tripStatus: trip.status 
            });
        }
        if (trip.status === 'finished') {
            return res.status(400).json({ 
                message: 'Cannot add expenses to a finished trip.',
                tripStatus: trip.status 
            });
        }

        // Check if files exist
        const receipts = req.body.receipts ? req.body.receipts : [];

        // Create a new expense using PostgreSQL model
        const newExpense = await Expense.create({
            userId: parseInt(userId),
            tripId: parseInt(tripId),
            categoryId: parseInt(categoryId),
            expenseTitle,
            amount: parseFloat(amount),
            currency,
            description,
            date: date || new Date(),
            receipts
        });

        res.status(200).json({ message: 'Expense added successfully!' });
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ message: 'Failed to add expense: ' + error.message });
    }
};

exports.advances = async (req, res) => {
    try {
        const userId = req.session.user.id;
        console.log('User ID:', userId);
        
        // Fetch trips for the current user
        const trips = await Trip.findByUserId(userId);
        console.log('All trips for user:', trips);

        // Format for view (map to expected format)
        const tripList = trips.map(t => ({
            _id: t.id,
            id: t.id,
            tripName: t.tripName || t.trip_name
        }));

        console.log('Fetched trips:', JSON.stringify(tripList, null, 2));

        // Render the EJS view and pass trips
        res.render('advances', { currentPath: req.url, trips: tripList });

    } catch (error) {
        console.error('Error fetching trips:', error);
        res.status(500).send('Server Error');
    }
};

exports.get_category = async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Error fetching categories', error });
    }
}

exports.post_category = async (req, res) => {
    const { name } = req.body;
    try {
        const newCategory = await Category.create({ name });
        res.status(201).json(newCategory);
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(400).json({ message: 'Error adding category', error });
    }
}

exports.delete_category = async (req, res) => {
    const { id } = req.body;
    try {
        const deletedCategory = await Category.delete(id);
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
        const { expenseTitle, amount, currency, description, date, receipts } = req.body;
        const userId = req.body.userId || req.session.user.id;
        const tripId = req.body.tripId;
        const categoryId = req.body.categoryId;

        if (!userId || !tripId || !categoryId || !expenseTitle || !amount || !currency) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newExpense = await Expense.create({
            userId: parseInt(userId),
            tripId: parseInt(tripId),
            categoryId: parseInt(categoryId),
            expenseTitle,
            amount: parseFloat(amount),
            currency,
            description,
            date: date || new Date(),
            receipts: receipts || []
        });

        res.status(201).json({ message: 'Expense added successfully', expense: newExpense });
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ message: 'Error adding expense: ' + error.message });
    }
};

exports.addAdvances = async (req, res) => {
    try {
        const { amount, currency, paidThrough, reference, notes } = req.body;
        const userId = req.body.userId || req.session.user.id;
        const tripId = req.body.tripId;

        if (!userId || !tripId || !amount || !currency || !paidThrough) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        if (tripId === 'Select' || !tripId) {
            return res.status(400).json({ success: false, message: 'Please select a valid trip' });
        }

        // Check trip status - must be approved and not finished
        const trip = await Trip.findById(parseInt(tripId));
        if (!trip) {
            return res.status(404).json({ success: false, message: 'Trip not found' });
        }
        if (trip.status !== 'approved') {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot add advances to ${trip.status} trip. Trip must be approved first.`,
                tripStatus: trip.status 
            });
        }
        if (trip.status === 'finished') {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot add advances to a finished trip.',
                tripStatus: trip.status 
            });
        }

        const newAdvance = await Advance.create({
            userId: parseInt(userId),
            tripId: parseInt(tripId),
            amount: parseFloat(amount),
            currency,
            paidThrough,
            referenceId: reference,
            notes
        });

        res.status(200).json({ success: true, message: 'Advance recorded successfully', advance: newAdvance });
    } catch (error) {
        console.error('Error recording advance:', error);
        res.status(500).json({ success: false, message: 'An error occurred while recording the advance' });
    }
}

exports.addReport = async (req, res) => {
    try {
        const { reportName, businessPurpose, tripId, duration } = req.body;
        const userId = req.session.user.id;
        
        if (!reportName || !businessPurpose || !tripId || !duration) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        if (!duration.startDate || !duration.endDate) {
            return res.status(400).json({ success: false, message: 'Start date and end date are required' });
        }

        const newReport = await Reports.create({
            userId: parseInt(userId),
            tripId: parseInt(tripId),
            reportName,
            businessPurpose,
            duration,
        });

        res.json({ success: true, message: 'Report added successfully' });
    } catch (error) {
        console.error('Error adding report:', error);
        res.status(500).json({ success: false, message: 'Failed to add report: ' + error.message });
    }
}

exports.getTripDetails = async (req, res) => {
    try {
        const tripId = parseInt(req.params.tripId);
        
        // Get trip details
        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        // Get expenses for this trip
        const expenses = await Expense.findByTripId(tripId);
        
        // Get advances for this trip
        const advances = await Advance.findByTripId(tripId);

        res.json({
            trip,
            expenses,
            advances
        });
    } catch (error) {
        console.error('Error fetching trip details:', error);
        res.status(500).json({ message: 'Error fetching trip details: ' + error.message });
    }
};

exports.approveExpenses = async (req, res) => {
    try {
        const { expenseIds } = req.body;
        const approvedBy = req.session.user.id;

        if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No expenses selected' });
        }

        const approved = await Expense.approveMultiple(expenseIds, approvedBy);
        res.json({ success: true, message: `${approved.length} expense(s) approved`, expenses: approved });
    } catch (error) {
        console.error('Error approving expenses:', error);
        res.status(500).json({ success: false, message: 'Error approving expenses: ' + error.message });
    }
};

exports.rejectExpense = async (req, res) => {
    try {
        const { expenseId, rejectionReason } = req.body;
        const approvedBy = req.session.user.id;

        if (!expenseId) {
            return res.status(400).json({ success: false, message: 'Expense ID required' });
        }
        if (!rejectionReason || rejectionReason.trim() === '') {
            return res.status(400).json({ success: false, message: 'Rejection reason required' });
        }

        const rejected = await Expense.reject(expenseId, approvedBy, rejectionReason);
        res.json({ success: true, message: 'Expense rejected', expense: rejected });
    } catch (error) {
        console.error('Error rejecting expense:', error);
        res.status(500).json({ success: false, message: 'Error rejecting expense: ' + error.message });
    }
};

exports.approveAdvances = async (req, res) => {
    try {
        const { advanceIds } = req.body;
        const approvedBy = req.session.user.id;

        if (!advanceIds || !Array.isArray(advanceIds) || advanceIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No advances selected' });
        }

        const approved = await Advance.approveMultiple(advanceIds, approvedBy);
        res.json({ success: true, message: `${approved.length} advance(s) approved`, advances: approved });
    } catch (error) {
        console.error('Error approving advances:', error);
        res.status(500).json({ success: false, message: 'Error approving advances: ' + error.message });
    }
};

exports.rejectAdvance = async (req, res) => {
    try {
        const { advanceId, rejectionReason } = req.body;
        const approvedBy = req.session.user.id;

        if (!advanceId) {
            return res.status(400).json({ success: false, message: 'Advance ID required' });
        }
        if (!rejectionReason || rejectionReason.trim() === '') {
            return res.status(400).json({ success: false, message: 'Rejection reason required' });
        }

        const rejected = await Advance.reject(advanceId, approvedBy, rejectionReason);
        res.json({ success: true, message: 'Advance rejected', advance: rejected });
    } catch (error) {
        console.error('Error rejecting advance:', error);
        res.status(500).json({ success: false, message: 'Error rejecting advance: ' + error.message });
    }
};

exports.finishTrip = async (req, res) => {
    try {
        const { tripId } = req.body;

        if (!tripId) {
            return res.status(400).json({ success: false, message: 'Trip ID required' });
        }

        const trip = await Trip.findById(parseInt(tripId));
        if (!trip) {
            return res.status(404).json({ success: false, message: 'Trip not found' });
        }

        if (trip.status !== 'approved') {
            return res.status(400).json({ 
                success: false, 
                message: 'Only approved trips can be marked as finished' 
            });
        }

        const updated = await Trip.updateStatus(parseInt(tripId), 'finished');
        res.json({ success: true, message: 'Trip marked as finished', trip: updated });
    } catch (error) {
        console.error('Error finishing trip:', error);
        res.status(500).json({ success: false, message: 'Error finishing trip: ' + error.message });
    }
}