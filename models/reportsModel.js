const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    reportName: { type: String, required: true },
    businessPurpose: { type: String, required: true },
    duration: {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true }
    },
    status: { type: String, enum: ['submitted', 'approved', 'rejected'], default: 'submitted' },
    rejectionReason: { type: String },  // For rejected reports
    approvalMessage: { type: String },  // For accepted reports
    reimbursementDate: { type: Date },  // If applicable
},{ timestamps: true });

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;