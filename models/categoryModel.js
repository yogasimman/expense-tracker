const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },  // e.g., meals, transportation
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;