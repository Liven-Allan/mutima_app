const mongoose = require('mongoose');

const StockEntrySchema = new mongoose.Schema({
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.01  // Minimum quantity of 0.01 to ensure positive values
  },
  date_received: {
    type: Date,
    required: true,
    default: Date.now
  },
  batch_number: {
    type: String,
    required: true,
    trim: true
  },
  // Recommended additional fields:
  expiry_date: {
    type: Date
  },
  unit_cost: {
    type: Number,
    min: 0
  },
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  entry_type: {
    type: String,
    enum: ['purchase', 'return', 'adjustment', 'transfer'],
    default: 'purchase'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for faster querying
StockEntrySchema.index({ item_id: 1 });
StockEntrySchema.index({ date_received: -1 }); // Descending for recent entries first
StockEntrySchema.index({ batch_number: 1 }, { unique: true });

// Middleware to update item stock when new entry is created
StockEntrySchema.post('save', async function(doc) {
  const Item = mongoose.model('Item');
  await Item.findByIdAndUpdate(doc.item_id, { 
    $inc: { current_stock: doc.quantity },
    $set: { date_received: doc.date_received }
  });
});

module.exports = mongoose.model('StockEntry', StockEntrySchema);