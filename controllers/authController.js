const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const Trip = require('../models/tripModel');

const { validationResult } = require('express-validator');

exports.loginPage = (req, res) => {
    if(req.session.isAuthenticated){
        return res.redirect('/');
    }
    res.render('login', { errors: [] });
};

exports.login = async (req, res) => {
    if(req.session.isAuthenticated){
        return res.redirect('/');
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('login', { errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const user = await User.findByEmail(email);
        if (!user) {
            return res.render('login', { errors: [{ msg: 'Invalid credentials' }] });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', { errors: [{ msg: 'Invalid credentials' }] });
        }

        // Set session
        req.session.isAuthenticated = true;
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        // Set cookies with user data
        res.cookie('name', user.name, { maxAge: 1000 * 60 * 60 * 24, httpOnly: true });
        res.cookie('email', user.email, { maxAge: 1000 * 60 * 60 * 24, httpOnly: true });
        res.cookie('role',user.role,{ maxAge: 1000 * 60 * 60 * 24, httpOnly: true });
        res.redirect('/');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.clearCookie('name');
        res.clearCookie('email');
        res.clearCookie('role');
        res.redirect('/login');
    });
};

exports.dashboardPage = (req, res) => {
    const name = req.cookies.name;
    res.render('dashboard', { name: name ,currentPath : req.url});
};


exports.index = async (req, res) => { 
    if (req.session.isAuthenticated) {
        const name = req.cookies.name;
        const role = req.cookies.role;

        try {
            // Retrieve trip data for the current logged-in user
            const userId = req.session.user.id;
            console.log("USER ID", userId);

            // Fetch trips for the current user
            const trips = await Trip.findByUserId(userId);

            // Log the trips to see what's being fetched
            console.log('Fetched trips:', trips);

            // Format trips for the view (map PostgreSQL fields to expected format)
            const tripList = trips.map(t => ({
                _id: t.id,
                id: t.id,
                tripName: t.tripName || t.trip_name
            }));

            // Render the index view with the trip data
            res.render('index', { name: name, currentPath: req.url, role: role, trips: tripList });
        } catch (error) {
            console.error('Error retrieving trips:', error);
            res.status(500).send('Server Error');
        }
    } else {
        return res.redirect('/login');
    }
};

