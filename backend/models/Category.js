const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  item_type: {
    type: String,
    enum: ['product', 'material', 'equipment', 'consumable', 'other'], // Example enum values
    required: true
  }
}, {
  timestamps: true
});

// Add index for faster queries
CategorySchema.index({ name: 1, item_type: 1 });

module.exports = mongoose.model('Category', CategorySchema);