const User = require('../models/userModel');
const Trip = require('../models/tripModel');
const Expense = require('../models/expenseModel');
const Category = require('../models/categoryModel');
const Reports = require('../models/reportsModel');
const Advances = require('../models/advancesModel');
const bcrypt = require('bcrypt');

exports.settings = async (req,res) =>{
    try{
        const userId = req.session.user.id;
        const user = await User.findById(userId).select('-password');

        if(!user){
            return res.redirect('/login');
        }

        res.render('settings',{
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            employeeId: user.employee_id,
            mobile: user.mobile,
            designation: user.designation,
            currentPath: req.url
        })
    }catch(err){
        console.error(err.message);
        res.status(500).send("Server Error");
    }
}
exports.expenses =async (req, res) => {
    try {
        // Retrieve user ID and role from session
        const userId = req.session.user.id;  // Assuming the user ID is stored in session
        const role = req.session.user.role;

        console.log("USER ID", userId);

        // Fetch tripId and tripName from the trips collection for the current user
        const trips = await Trip.find({ userId: userId }, { tripName: 1 }); // Fetch only tripName and tripId
        console.log('Fetched trips:', trips);

        // Fetch all users if the logged-in user is an admin
        let users = [];
        if (role === 'admin') {
            users = await User.find({}, { name: 1 });  // Fetch only the name field of all users
            console.log('Fetched users:', users);
        }

        // Render the advances view with the trip and user data
        res.render('expenses', { currentPath: req.url, trips: trips, users: users, role: role, user:userId });

    } catch (error) {
        console.error('Error retrieving trips and users:', error);
        res.status(500).send('Server Error');
    }
};

exports.trips = (req,res) =>{
        const role = req.session.user.role;
        res.render('trips',{currentPath: req.url,role: role});
    
}


exports.advances = async (req, res) => {
    try {
        // Retrieve user ID and role from session
        const userId = req.session.user.id;  // Assuming the user ID is stored in session
        const role = req.session.user.role;

        console.log("USER ID", userId);

        // Fetch tripId and tripName from the trips collection for the current user
        const trips = await Trip.find({ userId: userId }, { tripName: 1 }); // Fetch only tripName and tripId
        console.log('Fetched trips:', trips);

        // Fetch all users if the logged-in user is an admin
        let users = [];
        if (role === 'admin') {
            users = await User.find({}, { name: 1 });  // Fetch only the name field of all users
            console.log('Fetched users:', users);
        }

        // Render the advances view with the trip and user data
        res.render('advances', { currentPath: req.url, trips: trips, users: users, role: role, user: userId });

    } catch (error) {
        console.error('Error retrieving trips and users:', error);
        res.status(500).send('Server Error');
    }
};


exports.approvals = async (req, res) => {
    try {
        // Fetch all pending trips and reports
        const role = req.session.user.role;
        const pendingTrips = await Trip.find({ status: 'pending' }).lean();
        const pendingReports = await Reports.find({ status: 'submitted' }).lean();

        // Fetch all trips and reports
        const trips = await Trip.find().lean(); // Fetch all trips
        const reports = await Reports.find().lean(); // Fetch all reports

        res.render('approvals', { 
            currentPath: req.url,
            role: role,
            pendingTrips, 
            pendingReports,
            trips, // Pass all trips to the view
            reports // Pass all reports to the view
        });
    } catch (error) {
        console.error('Error fetching trips and reports:', error);
        res.status(500).send('Server Error');
    }
};



exports.addUser = async (req, res) => {
    const { name, email, password, employeeId, mobile, department, designation, role } = req.body;

    console.log('Password:', password); 
    console.log(req.body); // Check if password is present

    if (!password) {
        return res.status(400).json({ message: 'Password is required' });
    }

    try {
        // Hash the user's password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user instance with the hashed password
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            employee_id: employeeId,
            mobile,
            department,
            designation,
            role
        });

        // Save the user to the database
        await newUser.save();

        // Send a success response
        res.json({ message: 'User added successfully!' });
    } catch (error) {
        console.error(error);

        if (error.name === 'MongoError' && error.code === 11000) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        res.status(500).json({ message: 'Server error' });
    }
};

exports.addReports = async (req, res) => {



    try{
        const userId = req.session.user.id;
        const role = req.session.user.role;

        const trips = await Trip.find({ userId: userId }, { tripName: 1 }); // Fetch only tripName and tripId
        console.log('Fetched trips:', trips);

        // Fetch all users if the logged-in user is an admin
        let users = [];
        if (role === 'admin') {
            users = await User.find({}, { name: 1 });  // Fetch only the name field of all users
            console.log('Fetched users:', users);
        }
        res.render('addReport', { users, trips, role: role, user: userId, currentPath: req.url });

        
    }catch(error){
        console.error('Error retrieving trips and users:', error);
        res.status(500).send('Server Error');
    }
};

exports.analytics = async (req, res) => {
    const userId = req.session.user.id;
    const name = req.session.user.name;
    const role = req.session.user.role;
    const isAdmin = req.session.user.role === 'admin'; // Check if the user is an admin

    try {
        // My Analytics (user-based)
        const expenses = await Expense.aggregate([
            { $match: { userId } },
            { $group: { _id: "$categoryId", totalAmount: { $sum: "$amount" } } },
            { $sort: { _id: 1 } }
        ]);
        console.log('User Expenses:', expenses);

        const categories = await Category.find({ _id: { $in: expenses.map(e => e._id) } }).sort({ _id: 1 });
        console.log('Categories:', categories);

        const expenseCategories = categories.map(category => category.name);
        console.log('Expense Categories:', expenseCategories);

        const expenseAmounts = expenses.map(e => e.totalAmount);
        console.log('Expense Amounts:', expenseAmounts);

        const trips = await Trip.aggregate([
            { $match: { userId } },
            { $group: { _id: "$travelType", count: { $sum: 1 } } }
        ]);
        console.log('Trips:', trips);

        const tripCounts = trips.reduce((acc, trip) => {
            acc[trip._id] = trip.count;
            return acc;
        }, { local: 0, domestic: 0, international: 0 });
        console.log('Trip Counts:', tripCounts);

        const advances = await Advances.aggregate([
            { $match: { userId } },
            { $group: { _id: "$currency", totalAmount: { $sum: "$amount" } } }
        ]);
        console.log('Advances:', advances);

        const advanceAmounts = advances.map(a => a.totalAmount);
        console.log('Advance Amounts:', advanceAmounts);

        const advanceLabels = advances.map(a => a._id);
        console.log('Advance Labels:', advanceLabels);

        const reports = await Reports.aggregate([
            { $match: { userId } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        console.log('Reports:', reports);

        const reportStatuses = reports.reduce((acc, report) => {
            acc[report._id] = report.count;
            return acc;
        }, { submitted: 0, approved: 0, rejected: 0 });
        console.log('Report Statuses:', reportStatuses);

        // Overall Analytics (admin-only)
        let overallExpenseCategories = [];
        let overallExpenseAmounts = [];
        let overallTripCounts = {};
        let overallAdvanceAmounts = [];
        let overallReportStatuses = {};

        // Initialize overall labels
        let overallTripLabels = ['Local', 'Domestic', 'International'];
        let overallAdvanceLabels = [];
        let overallReportLabels = ['Submitted', 'Approved', 'Rejected'];

        if (isAdmin) {
            const overallExpenses = await Expense.aggregate([
                { $group: { _id: "$categoryId", totalAmount: { $sum: "$amount" } } },
                { $sort: { _id: 1 } }
            ]);
            console.log('Overall Expenses:', overallExpenses);

            const overallCategories = await Category.find({ _id: { $in: overallExpenses.map(e => e._id) } }).sort({ _id: 1 });
            console.log('Overall Categories:', overallCategories);

            overallExpenseCategories = overallCategories.map(category => category.name);
            console.log('Overall Expense Categories:', overallExpenseCategories);

            overallExpenseAmounts = overallExpenses.map(e => e.totalAmount);
            console.log('Overall Expense Amounts:', overallExpenseAmounts);

            const overallTrips = await Trip.aggregate([
                { $group: { _id: "$travelType", count: { $sum: 1 } } }
            ]);
            console.log('Overall Trips:', overallTrips);

            overallTripCounts = overallTrips.reduce((acc, trip) => {
                acc[trip._id] = trip.count;
                return acc;
            }, { local: 0, domestic: 0, international: 0 });
            console.log('Overall Trip Counts:', overallTripCounts);

            // Retrieve overall advances
            const overallAdvances = await Advances.aggregate([
                { $group: { _id: "$currency", totalAmount: { $sum: "$amount" } } }
            ]);
            console.log('Overall Advances:', overallAdvances);

            overallAdvanceAmounts = overallAdvances.map(a => a.totalAmount);
            console.log('Overall Advance Amounts:', overallAdvanceAmounts);

            overallAdvanceLabels = overallAdvances.map(a => a._id);
            console.log('Overall Advance Labels:', overallAdvanceLabels);

            const overallReports = await Reports.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]);
            console.log('Overall Reports:', overallReports);

            overallReportStatuses = overallReports.reduce((acc, report) => {
                acc[report._id] = report.count;
                return acc;
            }, { submitted: 0, approved: 0, rejected: 0 });
            console.log('Overall Report Statuses:', overallReportStatuses);
        }

        // Render the analytics view
        res.render('analytics', {
            currentPath: req.url,
            user: req.user,
            name: name,
            role: role,
            expenseCategories,
            expenseAmounts,
            tripLabels: ['Local', 'Domestic', 'International'],
            tripCounts: Object.values(tripCounts),
            advanceLabels,
            advanceAmounts,
            reportLabels: ['Submitted', 'Approved', 'Rejected'],
            reportStatuses: Object.values(reportStatuses),

            // For Overall Analytics (admin-only)
            isAdmin,
            overallExpenseCategories,
            overallExpenseAmounts,
            overallTripLabels, // Added overall trip labels
            overallTripCounts: Object.values(overallTripCounts),
            overallAdvanceLabels, // Added overall advance labels
            overallAdvanceAmounts,
            overallReportLabels, // Added overall report labels
            overallReportStatuses: Object.values(overallReportStatuses)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.sidebar =async (req, res) => {
    try {
        // Retrieve user ID and role from session
        const userId = req.session.user.id;  // Assuming the user ID is stored in session
        const role = req.session.user.role;

        console.log("USER ID", userId);

        // Fetch tripId and tripName from the trips collection for the current user
        const trips = await Trip.find({ userId: userId }, { tripName: 1 }); // Fetch only tripName and tripId
        console.log('Fetched trips:', trips);

        // Fetch all users if the logged-in user is an admin
        let users = [];
        if (role === 'admin') {
            users = await User.find({}, { name: 1 });  // Fetch only the name field of all users
            console.log('Fetched users:', users);
        }

        // Render the advances view with the trip and user data
        res.render('sidebar', { currentPath: req.url, trips: trips, users: users, role: role });

    } catch (error) {
        console.error('Error retrieving trips and users:', error);
        res.status(500).send('Server Error');
    }
};

exports.viewtrips = async (req, res) => {
    try {
        // Retrieve user ID and role from session
        const userId = req.session.user.id; // Assuming the user ID is stored in session
        const role = req.session.user.role;
        const name = req.session.user.name;

        console.log("USER ID", userId);

        // Fetch trips associated with the user ID
        const trips = await Trip.find({ userId: userId });
        console.log('Fetched trips:', trips);

        // Render the viewtrips page with the trip data
        res.render('viewtrips', { currentPath: req.url, trips: trips, role: role,name: name });
    } catch (error) {
        console.error('Error retrieving trips:', error);
        res.status(500).send('Server Error');
    }
};

exports.viewreports = async (req, res) => {
    try {
        // Retrieve user ID and role from session
        const userId = req.session.user.id; // Assuming the user ID is stored in session
        const role = req.session.user.role;
        const name = req.session.user.name;

        console.log("USER ID", userId);

        // Fetch trips associated with the user ID
        const reports = await Reports.find({ userId: userId });
        console.log('Fetched reports:', reports);

        // Render the viewtrips page with the trip data
        res.render('viewreports', { currentPath: req.url, reports: reports, role: role,name: name });
    } catch (error) {
        console.error('Error retrieving trips:', error);
        res.status(500).send('Server Error');
    }
};