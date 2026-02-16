const bcrypt = require('bcrypt');
const User = require('../models/userModel');

const { validationResult } = require('express-validator');

exports.loginPage = (req, res) => {
    if(req.session.isAuthenticated){
        return res.redirect('/app');
    }
    res.redirect('/app/login');
};

exports.login = async (req, res) => {
    if(req.session.isAuthenticated){
        return res.redirect('/app');
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
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
        res.redirect('/app');
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/app');
        }
        res.clearCookie('connect.sid');
        res.clearCookie('name');
        res.clearCookie('email');
        res.clearCookie('role');
        res.redirect('/app/login');
    });
};

exports.dashboardPage = (req, res) => {
    res.redirect('/app');
};


exports.index = (req, res) => { 
    if (req.session.isAuthenticated) {
        res.redirect('/app');
    } else {
        return res.redirect('/app/login');
    }
};

