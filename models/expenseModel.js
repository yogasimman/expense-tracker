const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    expenseTitle: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, enum: ['INR', 'USD'], required: true },
    description: { type: String },
    date: { type: Date, default: Date.now },
    receipts: [{
        type: mongoose.Schema.Types.ObjectId, // Reference to GridFS files
        ref: 'fs.files'  // GridFS stores file metadata in the 'fs.files' collection
    }]
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);
module.exports = Expense;
