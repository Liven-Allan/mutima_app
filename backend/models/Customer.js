const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    trim: true
  },
  phone: {
    type: String,
    required: false,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true;
        // Basic phone number validation (adjust based on your needs)
        return /^[0-9]{10,15}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  address: {
    type: String,
    required: false,
    trim: true
  },
  customer_type: {
    type: String,
    required: true,
    enum: ['retail', 'wholesale', 'corporate', 'government', 'online'],
    default: 'retail'
  },
  date_registered: {
    type: Date,
    default: Date.now
  },
  is_credit_customer: {
    type: Boolean,
    default: false
  },
  total_credit_balance: {
    type: Number,
    default: 0,
    min: 0
  },
  // Recommended additional fields:
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please enter a valid email address']
  },
  tax_id: {
    type: String,
    trim: true
  },
  contact_person: {
    type: String,
    trim: true
  },
  payment_terms: {
    type: Number,
    min: 0,
    default: 0 // Days
  },
  notes: {
    type: String,
    trim: true
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
CustomerSchema.index({ name: 1 });
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ customer_type: 1 });
CustomerSchema.index({ is_credit_customer: 1 });
CustomerSchema.index({ total_credit_balance: -1 });

module.exports = mongoose.model('Customer', CustomerSchema);