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
        res.render('advances', { currentPath: req.url, trips: trips, users: users, role: role });

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
        res.render('advances', { currentPath: req.url, trips: trips, users: users, role: role });

    } catch (error) {
        console.error('Error retrieving trips and users:', error);
        res.status(500).send('Server Error');
    }
};


exports.approvals = (req,res) =>{
      res.render('approvals',{currentPath: req.url});
    
}

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