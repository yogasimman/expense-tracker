const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const ajaxRoutes = require('./routes/ajaxRoutes');
const error404 = require('./middlewares/404Middleware');
const path = require('path');
const Trip = require('./models/tripModel');

const app = express();

// MongoDB Atlas connection (replace <db_password> with your actual password)
mongoose.connect('mongodb+srv://FinTrack:test@fintrack.ql0jx.mongodb.net/test?retryWrites=true&w=majority&appName=FinTrack')
    .then(() => console.log('MongoDB Atlas connected'))
    .catch(err => console.log(err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(cookieParser());

// Serve static files first
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware (use MongoStore for Atlas)
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb+srv://FinTrack:test@fintrack.ql0jx.mongodb.net/test?retryWrites=true&w=majority&appName=FinTrack' }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Routes
app.use('/', authRoutes);
app.use('/ajax', ajaxRoutes);

// Route to fetch trips for a selected user (only for admins)
app.get('/trips/:userId', async (req, res) => {
    try {   
        const userId = req.params.userId; // Get user ID from the URL
        const trips = await Trip.find({ userId: userId }, { tripName: 1 }); // Fetch trips for the selected user
        res.json(trips); // Send trips as JSON response
    } catch (error) {
        console.error('Error fetching trips:', error);
        res.status(500).send('Server Error');
    }
});


// 404 error middleware
app.use(error404);

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
