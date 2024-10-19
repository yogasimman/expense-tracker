// index.js
const mongoose = require('mongoose');

const mongoURI = 'mongodb://172.18.0.2:27017/express-tracker'; // Replace with the router's IP

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB Router');
        process.exit(0); // Exit after connection
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit with error
    });
