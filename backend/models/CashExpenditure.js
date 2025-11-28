const mongoose = require('mongoose');

const CashExpenditureSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  expenditure_date: {
    type: Date,
    required: true,
    default: Date.now,
    validate: {
      validator: function(v) {
        return v <= new Date();
      },
      message: 'Expenditure date cannot be in the future'
    }
  },
  expense_type: {
    type: String,
    required: true,
    default: 'Cash Expenditure'
  },
  // The following fields are optional for modal compatibility
  person_responsible: {
    type: String,
    trim: true
  },
  payment_source: {
    type: String,
    enum: ['petty_cash', 'bank_account', 'mobile_money', 'other'],
    default: 'petty_cash'
  },
  receipt_reference: {
    type: String,
    trim: true
  },
  remarks: {
    type: String,
    trim: true
  },
  expenditure_category: {
    type: String,
    enum: ['office_supplies', 'transport', 'utilities', 'maintenance', 'staff_welfare', 'other'],
    default: 'other'
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approval_date: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'reimbursed'],
    default: 'pending'
  },
  attachment_url: {
    type: String,
    trim: true
  },
  transaction_reference: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Pre-save hook to generate transaction reference
CashExpenditureSchema.pre('save', async function(next) {
  if (!this.transaction_reference) {
    // Use a timestamp and a random 4-digit number for uniqueness
    const date = this.expenditure_date || new Date();
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000); // 4-digit random
    this.transaction_reference = `EXP-${y}${m}${d}-${rand}`;
  }
  next();
});

// Indexes for better performance
CashExpenditureSchema.index({ expenditure_date: -1 }); // Most recent first
CashExpenditureSchema.index({ payment_source: 1 });
CashExpenditureSchema.index({ person_responsible: 1 });
CashExpenditureSchema.index({ status: 1 });
CashExpenditureSchema.index({ transaction_reference: 1 }, { unique: true });
CashExpenditureSchema.index({ expenditure_category: 1 });

// Add text index for search functionality
CashExpenditureSchema.index({
  purpose: 'text',
  remarks: 'text',
  receipt_reference: 'text',
  person_responsible: 'text'
});

module.exports = mongoose.model('CashExpenditure', CashExpenditureSchema);