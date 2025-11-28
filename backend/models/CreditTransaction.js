const mongoose = require('mongoose');

const CreditTransactionSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  sale_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    required: true
  },
  transaction_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  payment_status: {
    type: String,
    required: true,
    enum: ['pending', 'partially_paid', 'paid', 'overdue', 'written_off'],
    default: 'pending'
  },
  agreed_repayment_date: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v > this.transaction_date;
      },
      message: 'Repayment date must be after transaction date'
    }
  },
  remarks: {
    type: String,
    trim: true
  },
  // Recommended additional fields:
  amount_paid: {
    type: Number,
    default: 0,
    min: 0
  },
  last_payment_date: {
    type: Date
  },
  interest_rate: {
    type: Number,
    default: 0,
    min: 0
  },
  late_fee: {
    type: Number,
    default: 0,
    min: 0
  },
  reference_number: {
    type: String,
    unique: true
  },
  payment_history: [{
    payment_date: Date,
    amount: Number,
    payment_method: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentMethod'
    },
    notes: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for outstanding balance
CreditTransactionSchema.virtual('outstanding_balance').get(function() {
  return this.total_amount - this.amount_paid;
});

// Virtual for days overdue
CreditTransactionSchema.virtual('days_overdue').get(function() {
  if (this.payment_status === 'overdue' || (this.payment_status === 'pending' && new Date() > this.agreed_repayment_date)) {
    return Math.floor((new Date() - this.agreed_repayment_date) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Pre-save hook to generate reference number and update status
CreditTransactionSchema.pre('save', async function(next) {
  if (!this.reference_number) {
    const count = await this.constructor.countDocuments();
    this.reference_number = `CR-${this.transaction_date.getFullYear()}${(this.transaction_date.getMonth()+1).toString().padStart(2, '0')}-${(count + 1).toString().padStart(5, '0')}`;
  }

  // Update payment status based on amounts
  if (this.amount_paid >= this.total_amount) {
    this.payment_status = 'paid';
  } else if (this.amount_paid > 0) {
    this.payment_status = 'partially_paid';
  } else if (new Date() > this.agreed_repayment_date) {
    this.payment_status = 'overdue';
  }

  next();
});

// Post-save hook to update customer's credit balance
CreditTransactionSchema.post('save', async function(doc) {
  const Customer = mongoose.model('Customer');
  
  // Only update customer balance for NEW credit transactions
  // This prevents incorrect updates when payments are recorded
  if (this.isNew && doc.payment_status !== 'paid') {
    await Customer.findByIdAndUpdate(doc.customer_id, {
      $inc: { total_credit_balance: doc.total_amount }
    });
  }
});

// Indexes for better performance
CreditTransactionSchema.index({ customer_id: 1 });
CreditTransactionSchema.index({ sale_id: 1 });
CreditTransactionSchema.index({ transaction_date: -1 });
CreditTransactionSchema.index({ payment_status: 1 });
CreditTransactionSchema.index({ agreed_repayment_date: 1 });
CreditTransactionSchema.index({ reference_number: 1 }, { unique: true });

module.exports = mongoose.model('CreditTransaction', CreditTransactionSchema);