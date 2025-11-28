const mongoose = require('mongoose');

const RepaymentSchema = new mongoose.Schema({
  credit_transaction_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreditTransaction',
    required: true
  },
  amount_paid: {
    type: Number,
    required: true,
    min: 0.01,
    validate: {
      validator: async function(v) {
        const CreditTransaction = mongoose.model('CreditTransaction');
        const transaction = await CreditTransaction.findById(this.credit_transaction_id);
        return v <= (transaction.total_amount - transaction.amount_paid);
      },
      message: 'Payment amount exceeds outstanding balance'
    }
  },
  payment_date: {
    type: Date,
    required: true,
    default: Date.now,
    validate: {
      validator: function(v) {
        return v <= new Date();
      },
      message: 'Payment date cannot be in the future'
    }
  },
  remarks: {
    type: String,
    trim: true
  },
  payment_method_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod',
    required: true
  },
  // Recommended additional fields:
  receipt_number: {
    type: String,
    unique: true
  },
  recorded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  is_confirmed: {
    type: Boolean,
    default: false
  },
  confirmation_date: {
    type: Date
  },
  late_fee_paid: {
    type: Number,
    default: 0,
    min: 0
  },
  interest_paid: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Pre-save hook to generate receipt number
RepaymentSchema.pre('save', async function(next) {
  if (!this.receipt_number) {
    const count = await this.constructor.countDocuments();
    this.receipt_number = `RCPT-${this.payment_date.getFullYear()}${(this.payment_date.getMonth()+1).toString().padStart(2, '0')}-${(count + 1).toString().padStart(5, '0')}`;
  }
  next();
});

// Post-save hook to update credit transaction
RepaymentSchema.post('save', async function(doc) {
  const CreditTransaction = mongoose.model('CreditTransaction');
  
  // Update the credit transaction
  await CreditTransaction.findByIdAndUpdate(doc.credit_transaction_id, {
    $inc: { amount_paid: doc.amount_paid },
    $set: { last_payment_date: doc.payment_date },
    $push: { 
      payment_history: {
        payment_date: doc.payment_date,
        amount: doc.amount_paid,
        payment_method: doc.payment_method_id,
        notes: doc.remarks
      }
    }
  });

  // Update payment status if fully paid
  const transaction = await CreditTransaction.findById(doc.credit_transaction_id);
  if (transaction.amount_paid >= transaction.total_amount) {
    transaction.payment_status = 'paid';
    await transaction.save();
  }
});

// Post-save hook to update customer's credit balance
RepaymentSchema.post('save', async function(doc) {
  const CreditTransaction = mongoose.model('CreditTransaction');
  const Customer = mongoose.model('Customer');
  
  const transaction = await CreditTransaction.findById(doc.credit_transaction_id);
  await Customer.findByIdAndUpdate(transaction.customer_id, {
    $inc: { total_credit_balance: -doc.amount_paid }
  });
});

// Indexes for better performance
RepaymentSchema.index({ credit_transaction_id: 1 });
RepaymentSchema.index({ payment_date: -1 });
RepaymentSchema.index({ receipt_number: 1 }, { unique: true });
RepaymentSchema.index({ payment_method_id: 1 });

module.exports = mongoose.model('Repayment', RepaymentSchema);