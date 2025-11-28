const mongoose = require('mongoose');

const InventoryAdjustmentSchema = new mongoose.Schema({
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  adjustment_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  adjustment_type: {
    type: String,
    required: true,
    enum: ['addition', 'deduction', 'correction', 'write-off', 'transfer'],
    default: 'correction'
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  // Recommended additional fields:
  reference_number: {
    type: String,
    unique: true
  },
  adjusted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
InventoryAdjustmentSchema.index({ item_id: 1 });
InventoryAdjustmentSchema.index({ adjustment_date: -1 }); // Most recent first
InventoryAdjustmentSchema.index({ adjustment_type: 1 });

// Middleware to update item stock after adjustment
InventoryAdjustmentSchema.post('save', async function(doc) {
  const Item = mongoose.model('Item');
  const adjustmentFactor = doc.adjustment_type === 'deduction' || doc.adjustment_type === 'write-off' 
    ? -doc.quantity 
    : doc.quantity;
  
  await Item.findByIdAndUpdate(doc.item_id, { 
    $inc: { current_stock: adjustmentFactor }
  });
});

// Pre-save hook to generate reference number
InventoryAdjustmentSchema.pre('save', async function(next) {
  if (!this.reference_number) {
    const count = await this.constructor.countDocuments();
    this.reference_number = `ADJ-${Date.now()}-${count + 1}`;
  }
  next();
});

module.exports = mongoose.model('InventoryAdjustment', InventoryAdjustmentSchema);