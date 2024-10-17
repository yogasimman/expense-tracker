const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },           // Required field for user name
    email: { type: String, required: true, unique: true }, // Required and unique email
    password: { type: String, required: true },        // Required password field
    designation: { type: String, required: true },     // Required field for designation
    employee_id: { type: String, required: true, unique: true }, // Required and unique employee ID
    mobile: { type: String, required: true },          // Required field for mobile number
    department: { type: String, required: true },      // Required field for department
    role: { type: String, default: 'submitter' },       // Default role
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
