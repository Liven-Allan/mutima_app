const mongoose = require('mongoose');

const ItemLossSchema = new mongoose.Schema({
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  loss_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  quantity_lost: {
    type: Number,
    required: true,
    min: 0
  },
  unit_of_measure: {
    type: String,
    required: true,
    enum: ['kg', 'g', 'l', 'ml', 'pcs', 'box', 'packet', 'sack', 'bottle', 'can'],
    default: 'pcs'
  },
  loss_reason: {
    type: String,
    required: true,
    enum: [
      'damage',           // Physical damage during handling/transport
      'expiration',       // Items expired before sale
      'spoilage',         // Food items gone bad
      'breakage',         // Items broken during handling
      'theft',            // Stolen items
      'fire',             // Fire damage
      'flood',            // Water damage
      'pest_damage',      // Damage from pests/rodents
      'poor_storage',     // Damage due to improper storage
      'manufacturing_defect', // Defective items from supplier
      'other'             // Other reasons
    ]
  },
  loss_description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  estimated_cost: {
    type: Number,
    required: true,
    min: 0
  },
  reported_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  location: {
    type: String,
    trim: true,
    maxlength: 100
  },
  batch_number: {
    type: String,
    trim: true,
    maxlength: 50
  },
  supplier_batch: {
    type: String,
    trim: true,
    maxlength: 50
  },
  is_insured: {
    type: Boolean,
    default: false
  },
  insurance_claim_number: {
    type: String,
    trim: true,
    maxlength: 50
  },
  status: {
    type: String,
    enum: ['pending', 'investigated', 'resolved', 'written_off'],
    default: 'pending'
  },
  investigation_notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  preventive_measures: {
    type: String,
    trim: true,
    maxlength: 500
  },
  photos: [{
    filename: String,
    url: String,
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  witnesses: [{
    name: String,
    contact: String,
    statement: String
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true }
});

// Virtual for total loss value (quantity * estimated cost per unit)
ItemLossSchema.virtual('total_loss_value').get(function() {
  return this.quantity_lost * this.estimated_cost;
});

// Virtual for formatted loss date
ItemLossSchema.virtual('formatted_loss_date').get(function() {
  return this.loss_date.toLocaleDateString();
});

// Indexes for performance
ItemLossSchema.index({ item_id: 1, loss_date: -1 });
ItemLossSchema.index({ loss_reason: 1 });
ItemLossSchema.index({ status: 1 });
ItemLossSchema.index({ reported_by: 1 });
ItemLossSchema.index({ loss_date: -1 });

// Pre-save middleware to validate quantity
ItemLossSchema.pre('save', function(next) {
  if (this.quantity_lost <= 0) {
    return next(new Error('Quantity lost must be greater than 0'));
  }
  if (this.estimated_cost < 0) {
    return next(new Error('Estimated cost cannot be negative'));
  }
  next();
});

// Static method to get total losses for a specific period
ItemLossSchema.statics.getTotalLosses = async function(startDate, endDate) {
  const losses = await this.find({
    loss_date: { $gte: startDate, $lte: endDate }
  }).populate('item_id', 'name category_id');
  
  return losses.reduce((total, loss) => {
    return total + loss.total_loss_value;
  }, 0);
};

// Static method to get losses by reason
ItemLossSchema.statics.getLossesByReason = async function(startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        loss_date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$loss_reason',
        total_quantity: { $sum: '$quantity_lost' },
        total_value: { $sum: { $multiply: ['$quantity_lost', '$estimated_cost'] } },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { total_value: -1 }
    }
  ]);
};

// Instance method to update item stock after loss
ItemLossSchema.methods.updateItemStock = async function() {
  const Item = require('./Item');
  
  try {
    const item = await Item.findById(this.item_id);
    
    if (!item) {
      throw new Error(`Item with ID ${this.item_id} not found`);
    }
    
    // Validate that we're not losing more than available stock
    if (this.quantity_lost > item.total_quantity) {
      throw new Error(`Cannot lose ${this.quantity_lost} ${this.unit_of_measure} when only ${item.total_quantity} ${item.base_unit} are available`);
    }
    
    // Convert loss quantity to item's base unit if different
    let quantityToDeduct = this.quantity_lost;
    
    // Handle unit conversions if needed
    if (this.unit_of_measure !== item.base_unit) {
      // Basic conversion logic - can be enhanced based on business rules
      if (this.unit_of_measure === 'kg' && item.base_unit === 'g') {
        quantityToDeduct = this.quantity_lost * 1000;
      } else if (this.unit_of_measure === 'g' && item.base_unit === 'kg') {
        quantityToDeduct = this.quantity_lost / 1000;
      } else if (this.unit_of_measure === 'l' && item.base_unit === 'ml') {
        quantityToDeduct = this.quantity_lost * 1000;
      } else if (this.unit_of_measure === 'ml' && item.base_unit === 'l') {
        quantityToDeduct = this.quantity_lost / 1000;
      } else if (this.unit_of_measure === 'box' && item.base_unit === 'pcs') {
        // Assume 1 box = units_per_package pieces for unit-based items
        if (item.item_type === 'unit_based' && item.units_per_package) {
          quantityToDeduct = this.quantity_lost * item.units_per_package;
        }
      } else if (this.unit_of_measure === 'packet' && item.base_unit === 'pcs') {
        // Assume 1 packet = units_per_package pieces for unit-based items
        if (item.item_type === 'unit_based' && item.units_per_package) {
          quantityToDeduct = this.quantity_lost * item.units_per_package;
        }
      } else if (this.unit_of_measure === 'sack' && item.base_unit === 'kg') {
        // Assume 1 sack = weight_per_package kg for weighable items
        if (item.item_type === 'weighable' && item.weight_per_package) {
          quantityToDeduct = this.quantity_lost * item.weight_per_package;
        }
      } else {
        // For other conversions, assume 1:1 ratio
        console.log(`Warning: Converting ${this.unit_of_measure} to ${item.base_unit} using 1:1 ratio`);
      }
    }
    
    // Deduct the quantity from item stock
    const newQuantity = Math.max(0, item.total_quantity - quantityToDeduct);
    item.total_quantity = newQuantity;
    
    await item.save();
    
    console.log(`Stock updated for item ${item.name}: ${item.total_quantity + quantityToDeduct} → ${item.total_quantity} ${item.base_unit}`);
    
    return true;
  } catch (error) {
    console.error('Error updating item stock:', error);
    throw error;
  }
};

module.exports = mongoose.model('ItemLoss', ItemLossSchema); 