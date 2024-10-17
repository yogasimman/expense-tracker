const advanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, enum: ['INR', 'USD'], required: true },
    paidThrough: { type: String, required: true },  // e.g., bank, cash, card
    referenceId: { type: String },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const Advance = mongoose.model('Advance', advanceSchema);