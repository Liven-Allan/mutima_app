const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false
  },
  customer_info: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    }
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  customer_type: {
    type: String,
    required: false,
    enum: ['retail', 'wholesale', 'online', 'corporate', 'credit'],
    default: 'retail'
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  payment_method_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod',
    required: false
  },
  // Recommended additional fields:
  invoice_number: {
    type: String
  },
  discount_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  tax_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  grand_total: {
    type: Number,
    required: true,
    min: 0.01
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'refunded'],
    default: 'completed'
  },
  sales_person_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true
  },
  payment_status: {
    type: String,
    enum: ['paid', 'partial', 'unpaid'],
    default: 'paid'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for sale items (to be populated when needed)
SaleSchema.virtual('items', {
  ref: 'SaleItem',
  localField: '_id',
  foreignField: 'sale_id'
});

// Pre-save hook to generate invoice number and calculate grand total
SaleSchema.pre('save', async function(next) {
  try {
    if (!this.invoice_number) {
      const count = await this.constructor.countDocuments();
      this.invoice_number = `INV-${this.date.getFullYear()}${(this.date.getMonth()+1).toString().padStart(2, '0')}-${(count + 1).toString().padStart(5, '0')}`;
    }

    if (!this.grand_total || this.isModified('total_amount') || this.isModified('discount_amount') || this.isModified('tax_amount')) {
      this.grand_total = this.total_amount - this.discount_amount + this.tax_amount;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Indexes for better performance
SaleSchema.index({ customer_id: 1 });
SaleSchema.index({ date: -1 }); // Most recent sales first
SaleSchema.index({ status: 1 });
SaleSchema.index({ payment_status: 1 });

module.exports = mongoose.model('Sale', SaleSchema);