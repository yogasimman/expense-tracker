const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const { body, validationResult } = require('express-validator');
const app = express();

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/express-tracker')
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// User schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'submitter' }
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(express.urlencoded({ extended: false }));


// Session middleware
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/express-tracker' }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Cookie middleware
app.use(cookieParser());

// Check if user is logged in (middleware)
function isAuthenticated(req, res, next) {
    if (req.session.isAuthenticated) {
        return next();
    } else {
        res.redirect('/login');
    }
}

// Routes
app.get('/login', (req, res) => {
    res.render('login.ejs', { errors: [] });
});

app.post('/login', [
    body('email', 'Please enter a valid email').isEmail(),
    body('password', 'Password is required').notEmpty()
], async (req, res) => {
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
            username: user.username,
            email: user.email,
            role: user.role
        };

        // Set cookies with user data
        res.cookie('username', user.username, { maxAge: 1000 * 60 * 60 * 24, httpOnly: true });
        res.cookie('email', user.email, { maxAge: 1000 * 60 * 60 * 24, httpOnly: true });

        res.redirect('/dashboard');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/dashboard');
        }

        res.clearCookie('connect.sid');
        res.clearCookie('username');
        res.clearCookie('email');
        res.redirect('/login');
    });
});

// Protect routes
app.get('/dashboard', isAuthenticated, (req, res) => {
    const username = req.cookies.username;
    res.render('dashboard', { username: username });
});


// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
