const mongoose = require('mongoose');
const tripSchema = new mongoose.Schema({
    tripName: { type: String, required: true },
    travelType: { type: String, enum: ['local', 'domestic', 'international'], required: true },
    itinerary: {
        flight: {
            departFrom: { type: String },
            arriveAt: { type: String },
            departureDate: { type: Date },
            returnDate: { type: Date },  // Only for flight
            description: { type: String }
        },
        bus: {
            departFrom: { type: String },
            arriveAt: { type: String },
            departureDate: { type: Date },
            description: { type: String }
        },
        train: {
            departFrom: { type: String },
            arriveAt: { type: String },
            departureDate: { type: Date },
            description: { type: String }
        },
        cab: {
            pickUpLocation: { type: String },
            dropOffLocation: { type: String },
            pickUpDate: { type: Date },
            description: { type: String }
        }
    },
    status: { type: String, enum: ['accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const Trip = mongoose.model('Trip', tripSchema);
module.exports = Trip;