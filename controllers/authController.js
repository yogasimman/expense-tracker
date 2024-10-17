const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
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
        const user = await User.findOne({ email });
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
            id: user._id,
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


exports.index = (req,res) => { 
    if(req.session.isAuthenticated){
        const name = req.cookies.name;
        const role = req.cookies.role;
        res.render('index',{name: name, currentPath : req.url, role: role});
    }else{
        return res.redirect('/login');
    }
}

