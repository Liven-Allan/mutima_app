const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  item_type: {
    type: String,
    required: true,
    enum: ['weighable', 'unit_based']
  },
  base_unit: {
    type: String,
    required: true,
    enum: ['kg', 'g', 'l', 'ml', 'pcs', 'box', 'packet', 'sack', 'bottle', 'can'],
    default: 'pcs'
  },
  package_unit: {
    type: String,
    required: true
  },
  weight_per_package: {
    type: Number,
    required: function() { return this.item_type === 'weighable'; },
    min: 0
  },
  units_per_package: {
    type: Number,
    required: function() { return this.item_type === 'unit_based'; },
    min: 1
  },
  selling_price_per_unit: {
    type: Number,
    required: true,
    min: 0
  },
  purchase_price_per_package: {
    type: Number,
    required: true,
    min: 0
  },
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  expiry_date: {
    type: Date
  },
  minimum_stock: {
    type: Number,
    default: 0
  },
  brand: {
    type: String
  },
  total_quantity: {
    type: Number,
    default: 0,
    min: 0
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true } // Include virtuals when converting to JSON
});

// Virtual for purchase price per unit (auto-calculated)
ItemSchema.virtual('purchase_price_per_unit').get(function() {
  if (this.item_type === 'weighable') {
    return this.purchase_price_per_package / this.weight_per_package;
  } else if (this.item_type === 'unit_based') {
    return this.purchase_price_per_package / this.units_per_package;
  }
  return undefined; 
});

// Virtual for profit margin
ItemSchema.virtual('profit_margin').get(function() {
  return this.selling_price_per_unit - this.purchase_price_per_unit;
});

// Indexes for performance
ItemSchema.index({ name: 1, brand: 1 });
ItemSchema.index({ item_type: 1, category_id: 1 });

module.exports = mongoose.model('Item', ItemSchema);