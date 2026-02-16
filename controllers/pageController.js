const bcrypt = require('bcrypt');
const User = require('../models/userModel');

exports.settings = (req, res) => {
    res.redirect('/app/settings');
};

exports.expenses = (req, res) => {
    res.redirect('/app/expenses');
};

exports.trips = (req, res) => {
    res.redirect('/app/trips');
};

exports.advances = (req, res) => {
    res.redirect('/app/advances');
};

exports.approvals = (req, res) => {
    res.redirect('/app/approvals');
};

exports.addUser = async (req, res) => {
    const { name, email, password, employeeId, mobile, department, designation, role } = req.body;

    if (!password) {
        return res.status(400).json({ message: 'Password is required' });
    }

    try {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

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

exports.analytics = (req, res) => {
    res.redirect('/app/analytics');
};

exports.sidebar = (req, res) => {
    res.redirect('/app');
};

exports.viewtrips = (req, res) => {
    res.redirect('/app/trips');
};

exports.tripDetails = (req, res) => {
    const tripId = req.params.tripId;
    res.redirect(`/app/trips/${tripId}`);
};