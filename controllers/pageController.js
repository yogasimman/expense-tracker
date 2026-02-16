const User = require('../models/userModel');
const Trip = require('../models/tripModel');
const Expense = require('../models/expenseModel');
const Category = require('../models/categoryModel');
const Reports = require('../models/reportsModel');
const Advances = require('../models/advancesModel');
const AnalyticsHelper = require('./analyticsHelper');
const bcrypt = require('bcrypt');

exports.settings = async (req,res) =>{
    try{
        const userId = req.session.user.id;
        const user = await User.findById(userId);

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
        const userId = req.session.user.id;
        const role = req.session.user.role;

        console.log("USER ID", userId);

        // Fetch trips for the current user
        const trips = await Trip.findByUserId(userId);
        const tripList = trips.map(t => ({ _id: t.id, id: t.id, tripName: t.tripName || t.trip_name }));
        console.log('Fetched trips:', tripList);

        // Fetch all users if the logged-in user is an admin
        let users = [];
        if (role === 'admin') {
            const allUsers = await User.findAll();
            users = allUsers.map(u => ({ _id: u.id, id: u.id, name: u.name }));
            console.log('Fetched users:', users);
        }

        res.render('expenses', { currentPath: req.url, trips: tripList, users: users, role: role, user:userId });

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
        const userId = req.session.user.id;
        const role = req.session.user.role;

        console.log("USER ID", userId);

        // Fetch trips for the current user
        const trips = await Trip.findByUserId(userId);
        const tripList = trips.map(t => ({ _id: t.id, id: t.id, tripName: t.tripName || t.trip_name }));
        console.log('Fetched trips:', tripList);

        // Fetch all users if the logged-in user is an admin
        let users = [];
        if (role === 'admin') {
            const allUsers = await User.findAll();
            users = allUsers.map(u => ({ _id: u.id, id: u.id, name: u.name }));
            console.log('Fetched users:', users);
        }

        res.render('advances', { currentPath: req.url, trips: tripList, users: users, role: role, user: userId });

    } catch (error) {
        console.error('Error retrieving trips and users:', error);
        res.status(500).send('Server Error');
    }
};


exports.approvals = async (req, res) => {
    try {
        const role = req.session.user.role;
        
        // Fetch pending trips and reports
        const pendingTrips = await Trip.findAll({ status: 'pending' });
        const pendingReports = await Reports.findAll({ status: 'submitted' });

        // Fetch all trips and reports
        const trips = await Trip.findAll();
        const reports = await Reports.findAll();

        res.render('approvals', { 
            currentPath: req.url,
            role: role,
            pendingTrips, 
            pendingReports,
            trips,
            reports
        });
    } catch (error) {
        console.error('Error fetching trips and reports:', error);
        res.status(500).send('Server Error');
    }
};



exports.addUser = async (req, res) => {
    const { name, email, password, employeeId, mobile, department, designation, role } = req.body;

    console.log('Password:', password); 
    console.log(req.body);

    if (!password) {
        return res.status(400).json({ message: 'Password is required' });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash the user's password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            employee_id: employeeId,
            mobile,
            department,
            designation,
            role
        });

        res.json({ message: 'User added successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.addReports = async (req, res) => {
    try{
        const userId = req.session.user.id;
        const role = req.session.user.role;

        // Fetch trips for the current user
        const trips = await Trip.findByUserId(userId);
        const tripList = trips.map(t => ({ _id: t.id, id: t.id, tripName: t.tripName || t.trip_name }));
        console.log('Fetched trips:', tripList);

        // Fetch all users if the logged-in user is an admin
        let users = [];
        if (role === 'admin') {
            const allUsers = await User.findAll();
            users = allUsers.map(u => ({ _id: u.id, id: u.id, name: u.name }));
            console.log('Fetched users:', users);
        }
        
        res.render('addReport', { users, trips: tripList, role: role, user: userId, currentPath: req.url });
    }catch(error){
        console.error('Error retrieving trips and users:', error);
        res.status(500).send('Server Error');
    }
};

exports.analytics = async (req, res) => {
    const userId = req.session.user.id;
    const name = req.session.user.name;
    const role = req.session.user.role;
    const isAdmin = req.session.user.role === 'admin';

    try {
        // User Analytics
        const expenses = await AnalyticsHelper.getUserExpensesByCategory(userId);
        const expenseCategories = expenses.map(e => e.name);
        const expenseAmounts = expenses.map(e => parseFloat(e.total_amount));

        const tripCounts = await AnalyticsHelper.getUserTripsByType(userId);

        const advances = await AnalyticsHelper.getUserAdvancesByCurrency(userId);
        const advanceLabels = advances.map(a => a.currency);
        const advanceAmounts = advances.map(a => parseFloat(a.total_amount));

        const reportStatuses = await AnalyticsHelper.getUserReportsByStatus(userId);

        // Overall Analytics (admin-only)
        let overallExpenseCategories = [];
        let overallExpenseAmounts = [];
        let overallTripCounts = {};
        let overallAdvanceLabels = [];
        let overallAdvanceAmounts = [];
        let overallReportStatuses = {};

        if (isAdmin) {
            const overallExpenses = await AnalyticsHelper.getOverallExpensesByCategory();
            overallExpenseCategories = overallExpenses.map(e => e.name);
            overallExpenseAmounts = overallExpenses.map(e => parseFloat(e.total_amount));

            overallTripCounts = await AnalyticsHelper.getOverallTripsByType();

            const overallAdvances = await AnalyticsHelper.getOverallAdvancesByCurrency();
            overallAdvanceLabels = overallAdvances.map(a => a.currency);
            overallAdvanceAmounts = overallAdvances.map(a => parseFloat(a.total_amount));

            overallReportStatuses = await AnalyticsHelper.getOverallReportsByStatus();
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
            tripCounts: [tripCounts.local, tripCounts.domestic, tripCounts.international],
            advanceLabels,
            advanceAmounts,
            reportLabels: ['Submitted', 'Approved', 'Rejected'],
            reportStatuses: [reportStatuses.submitted, reportStatuses.approved, reportStatuses.rejected],

            // For Overall Analytics (admin-only)
            isAdmin,
            overallExpenseCategories,
            overallExpenseAmounts,
            overallTripLabels: ['Local', 'Domestic', 'International'],
            overallTripCounts: [overallTripCounts.local, overallTripCounts.domestic, overallTripCounts.international],
            overallAdvanceLabels,
            overallAdvanceAmounts,
            overallReportLabels: ['Submitted', 'Approved', 'Rejected'],
            overallReportStatuses: [overallReportStatuses.submitted, overallReportStatuses.approved, overallReportStatuses.rejected]
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.sidebar =async (req, res) => {
    try {
        const userId = req.session.user.id;
        const role = req.session.user.role;

        console.log("USER ID", userId);

        // Fetch trips for the current user
        const trips = await Trip.findByUserId(userId);
        const tripList = trips.map(t => ({ _id: t.id, id: t.id, tripName: t.tripName || t.trip_name }));
        console.log('Fetched trips:', tripList);

        // Fetch all users if the logged-in user is an admin
        let users = [];
        if (role === 'admin') {
            const allUsers = await User.findAll();
            users = allUsers.map(u => ({ _id: u.id, id: u.id, name: u.name }));
            console.log('Fetched users:', users);
        }

        res.render('sidebar', { currentPath: req.url, trips: tripList, users: users, role: role });

    } catch (error) {
        console.error('Error retrieving trips and users:', error);
        res.status(500).send('Server Error');
    }
};

exports.viewtrips = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const role = req.session.user.role;
        const name = req.session.user.name;

        console.log("USER ID", userId);

        // Fetch trips for the current user
        const trips = await Trip.findByUserId(userId);
        console.log('Fetched trips:', trips);

        res.render('viewtrips', { currentPath: req.url, trips: trips, role: role,name: name });
    } catch (error) {
        console.error('Error retrieving trips:', error);
        res.status(500).send('Server Error');
    }
};

exports.viewreports = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const role = req.session.user.role;
        const name = req.session.user.name;

        console.log("USER ID", userId);

        // Fetch reports for the current user
        const reports = await Reports.findByUserId(userId);
        console.log('Fetched reports:', reports);

        res.render('viewreports', { currentPath: req.url, reports: reports, role: role,name: name });
    } catch (error) {
        console.error('Error retrieving reports:', error);
        res.status(500).send('Server Error');
    }
};

exports.tripDetails = async (req, res) => {
    try {
        const role = req.session.user.role;
        const tripId = req.params.tripId;

        // Only admins should access this page
        if (role !== 'admin') {
            return res.status(403).send('Access denied');
        }

        res.render('trip-details', { 
            currentPath: req.url,
            role: role,
            tripId: tripId
        });
    } catch (error) {
        console.error('Error loading trip details page:', error);
        res.status(500).send('Server Error');
    }
};