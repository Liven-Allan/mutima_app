const mongoose = require('mongoose');

const PaymentMethodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
PaymentMethodSchema.index({ name: 1 });
PaymentMethodSchema.index({ is_active: 1 });

module.exports = mongoose.model('PaymentMethod', PaymentMethodSchema);