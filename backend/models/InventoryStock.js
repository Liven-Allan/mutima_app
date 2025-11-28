const mongoose = require('mongoose');

const InventoryStockSchema = new mongoose.Schema({
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
    unique: true // One stock record per item
  },
  full_packages: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  partial_quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  last_updated: {
    type: Date,
    default: Date.now
  },
  // Additional tracking fields
  last_adjustment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryAdjustment'
  },
  stock_value: {
    type: Number, // Calculated value of current stock
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Virtual for total quantity (full packages + partial)
InventoryStockSchema.virtual('total_quantity').get(function() {
  const item = this.populated('item_id') || this.item_id;
  
  if (!item || !item.item_type) return 0;
  
  if (item.item_type === 'weighable') {
    return (this.full_packages * item.weight_per_package) + this.partial_quantity;
  } else if (item.item_type === 'unit_based') {
    return (this.full_packages * item.units_per_package) + this.partial_quantity;
  }
  return this.full_packages; // For single_unit items
});

// Update stock value whenever stock changes
InventoryStockSchema.pre('save', async function(next) {
  try {
    const Item = mongoose.model('Item');
    
    // Only calculate stock_value if we have a valid item_id
    if (this.item_id && typeof this.item_id === 'string') {
      const item = await Item.findById(this.item_id);
      if (item) {
        // Calculate total quantity for stock value
        let totalQty = 0;
        if (item.item_type === 'weighable') {
          totalQty = (this.full_packages * item.weight_per_package) + this.partial_quantity;
        } else if (item.item_type === 'unit_based') {
          totalQty = (this.full_packages * item.units_per_package) + this.partial_quantity;
        } else {
          totalQty = this.full_packages;
        }
        this.stock_value = totalQty * item.selling_price_per_unit;
      }
    }
    
    this.last_updated = new Date();
    next();
  } catch (error) {
    console.error('Error in InventoryStock pre-save middleware:', error);
    next(error);
  }
});

// Middleware to update stock after adjustments
InventoryStockSchema.statics.processAdjustment = async function(adjustment) {
  const Item = mongoose.model('Item');
  const item = await Item.findById(adjustment.item_id);
  
  if (!item) {
    throw new Error(`Item not found for adjustment: ${adjustment.item_id}`);
  }
  
  let stock = await this.findOne({ item_id: adjustment.item_id });
  if (!stock) {
    // Create new stock record if it doesn't exist
    stock = new this({ 
      item_id: adjustment.item_id,
      full_packages: 0,
      partial_quantity: 0
    });
  }

  const adjustmentFactor = adjustment.adjustment_type === 'deduction' || 
                         adjustment.adjustment_type === 'write-off' 
                         ? -adjustment.quantity 
                         : adjustment.quantity;

  console.log(`Processing adjustment for ${item.name}:`, {
    currentStock: {
      full_packages: stock.full_packages,
      partial_quantity: stock.partial_quantity
    },
    adjustment: {
      type: adjustment.adjustment_type,
      quantity: adjustment.quantity,
      factor: adjustmentFactor
    },
    item: {
      type: item.item_type,
      weight_per_package: item.weight_per_package,
      units_per_package: item.units_per_package
    }
  });

  if (item.item_type === 'weighable') {
    // Convert kg adjustment to package + partial updates
    const currentTotalKg = (stock.full_packages * item.weight_per_package) + stock.partial_quantity;
    const newTotalKg = currentTotalKg + adjustmentFactor;
    stock.full_packages = Math.floor(newTotalKg / item.weight_per_package);
    stock.partial_quantity = newTotalKg % item.weight_per_package;
    
    console.log(`Weighable calculation:`, {
      currentTotalKg,
      newTotalKg,
      newFullPackages: stock.full_packages,
      newPartialQuantity: stock.partial_quantity
    });
  } 
  else if (item.item_type === 'unit_based') {
    // Convert unit adjustment to package + partial updates
    const currentTotalUnits = (stock.full_packages * item.units_per_package) + stock.partial_quantity;
    const newTotalUnits = currentTotalUnits + adjustmentFactor;
    stock.full_packages = Math.floor(newTotalUnits / item.units_per_package);
    stock.partial_quantity = newTotalUnits % item.units_per_package;
    
    console.log(`Unit-based calculation:`, {
      currentTotalUnits,
      newTotalUnits,
      newFullPackages: stock.full_packages,
      newPartialQuantity: stock.partial_quantity
    });
  } 
  else {
    // Single unit items
    stock.full_packages += adjustmentFactor;
  }

  stock.last_adjustment_id = adjustment._id;
  stock.last_updated = new Date();
  
  console.log(`Final stock state for ${item.name}:`, {
    full_packages: stock.full_packages,
    partial_quantity: stock.partial_quantity,
    last_adjustment_id: stock.last_adjustment_id
  });
  
  return stock.save();
};

// Indexes
InventoryStockSchema.index({ item_id: 1 });
InventoryStockSchema.index({ last_updated: -1 });



module.exports = mongoose.model('InventoryStock', InventoryStockSchema);