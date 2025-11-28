const mongoose = require('mongoose');

const CommodityRequestSchema = new mongoose.Schema({
  commodity_name: {
    type: String,
    required: true,
    trim: true
  },
  requested_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  quantity_desired: {
    type: Number,
    required: false,
    min: 0.01
  },
  product_type: {
    type: String,
    required: true,
    enum: ['agricultural', 'manufactured', 'mineral', 'energy', 'other', 'weight_based', 'unit_based'],
    default: 'other'
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected', 'fulfilled', 'partially_fulfilled'],
    default: 'pending'
  },
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customer_contact: {
    type: String,
    required: false,
    trim: true
  },
  expected_delivery_date: {
    type: Date,
    validate: {
      validator: function(v) {
        return v > this.requested_date;
      },
      message: 'Expected delivery date must be after requested date'
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  notes: {
    type: String,
    trim: true
  },
  fulfilled_quantity: {
    type: Number,
    default: 0,
    min: 0
  },
  fulfillment_date: {
    type: Date
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approval_date: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for remaining quantity to fulfill
CommodityRequestSchema.virtual('remaining_quantity').get(function() {
  return this.quantity_desired - this.fulfilled_quantity;
});

// Pre-save hook to update status based on fulfillment
CommodityRequestSchema.pre('save', function(next) {
  if (this.fulfilled_quantity >= this.quantity_desired) {
    this.status = 'fulfilled';
    this.fulfillment_date = this.fulfillment_date || new Date();
  } else if (this.fulfilled_quantity > 0) {
    this.status = 'partially_fulfilled';
  }
  next();
});

// Indexes for better performance
CommodityRequestSchema.index({ customer_id: 1 });
CommodityRequestSchema.index({ requested_date: -1 }); // Most recent first
CommodityRequestSchema.index({ status: 1 });
CommodityRequestSchema.index({ product_type: 1 });
CommodityRequestSchema.index({ priority: 1 });

// Text index for search functionality
CommodityRequestSchema.index({ commodity_name: 'text', notes: 'text' });

module.exports = mongoose.model('CommodityRequest', CommodityRequestSchema);