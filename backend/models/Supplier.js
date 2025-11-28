const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  contact_info: {
    type: String,
    required: true,
    trim: true
  },
  // Additional recommended fields:
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please enter a valid email address']
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
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

// Add text index for search functionality
SupplierSchema.index({ 
  name: 'text', 
  contact_info: 'text',
  email: 'text',
  address: 'text'
});

module.exports = mongoose.model('Supplier', SupplierSchema);