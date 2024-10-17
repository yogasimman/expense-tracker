const mongoose = require('mongoose');
const tripSchema = new mongoose.Schema({
    tripName: { type: String, required: true },
    travelType: { type: String, enum: ['local', 'domestic', 'international'], required: true },
    itinerary: {
        flights: [{
            departFrom: { type: String },
            arriveAt: { type: String },
            departureDate: { type: Date },
            returnDate: { type: Date },  // Only for flight
            description: { type: String }
        }],
        buses: [{
            departFrom: { type: String },
            arriveAt: { type: String },
            departureDate: { type: Date },
            description: { type: String }
        }],
        trains: [{
            departFrom: { type: String },
            arriveAt: { type: String },
            departureDate: { type: Date },
            description: { type: String }
        }],
        cabs: [{
            pickUpLocation: { type: String },
            dropOffLocation: { type: String },
            pickUpDate: { type: Date },
            description: { type: String }
        }]
    },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    userId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }] // Reference to the User model
    
},{ timestamps: true });

// Cascading delete middleware for trip removal
tripSchema.pre('remove', async function(next) {
    if (this.status === 'approved') {
        return next(new Error('Cannot delete an approved report'));
    }

    try {
        // Delete related expenses
        await Expense.deleteMany({ tripId: this._id });
        
        // Delete related reports
        await Report.deleteMany({ tripId: this._id });
        
        // Delete related advances
        await Advance.deleteMany({ tripId: this._id });

        next();  // Continue to delete the trip itself
    } catch (err) {
        next(err);  // Handle error
    }
});

const Trip = mongoose.model('Trip', tripSchema);
module.exports = Trip;