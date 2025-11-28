const mongoose = require('mongoose');

const SaleItemSchema = new mongoose.Schema({
  sale_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    required: true
  },
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  quantity_sold: {
    type: Number,
    required: true,
    min: 0.01
  },
  unit_price: {
    type: Number,
    required: true,
    min: 0
  },
  total_price: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  // Add fields for package-aware tracking
  full_packages_sold: {
    type: Number,
    default: 0
  },
  partial_quantity_sold: {
    type: Number,
    default: 0
  },
  // ... (rest of your existing fields)
}, { 
  timestamps: true 
});

module.exports = mongoose.model('SaleItem', SaleItemSchema);