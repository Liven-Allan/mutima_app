const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const User = require('./models/User');
const Item = require('./models/Item');
const Supplier = require('./models/Supplier');
const Category = require('./models/Category');
const Customer = require('./models/Customer');
const Sale = require('./models/Sale');
const SaleItem = require('./models/SaleItem');
const PaymentMethod = require('./models/PaymentMethod');
const CreditTransaction = require('./models/CreditTransaction');
const Repayment = require('./models/Repayment');
const CommodityRequest = require('./models/CommodityRequest');
const CashExpenditure = require('./models/CashExpenditure');
const InventoryAdjustment = require('./models/InventoryAdjustment');
const InventoryStock = require('./models/InventoryStock');
const ItemLoss = require('./models/ItemLoss');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- Seed Categories ---
async function seedCategories() {
  try {
    const count = await Category.countDocuments();
    if (count > 0) {
      console.log('Categories already exist.');
      return;
    }

    const categories = [
      { name: 'Grains & Cereals', item_type: 'product' },
      { name: 'Flours & Baking', item_type: 'product' },
      { name: 'Household & Cleaning', item_type: 'product' },
      { name: 'Cooking Essentials', item_type: 'product' },
      { name: 'Beverages', item_type: 'product' },
      { name: 'Snacks & Confectionery', item_type: 'product' },
      { name: 'Personal Care & Toiletries', item_type: 'product' },
      { name: 'School Items', item_type: 'product' },
    ];

    await Category.insertMany(categories);
    console.log('Categories have been seeded successfully.');
  } catch (err) {
    console.error('Error seeding categories:', err);
  }
}

// --- Seed Payment Methods ---
async function seedPaymentMethods() {
  try {
    const count = await PaymentMethod.countDocuments();
    if (count > 0) {
      console.log('Payment methods already exist.');
      return;
    }

    const paymentMethods = [
      { name: 'Cash', description: 'Cash payment' },
      { name: 'Mobile Money', description: 'Mobile money transfer' },
      { name: 'Bank Transfer', description: 'Bank transfer payment' },
      { name: 'Credit Card', description: 'Credit card payment' },
    ];

    await PaymentMethod.insertMany(paymentMethods);
    console.log('Payment methods have been seeded successfully.');
  } catch (err) {
    console.error('Error seeding payment methods:', err);
  }
}

// --- Seed Sample Items ---
async function seedSampleItems() {
  try {
    const count = await Item.countDocuments();
    if (count > 0) {
      console.log('Items already exist.');
      return;
    }

    // Get a category for the items
    const category = await Category.findOne();
    if (!category) {
      console.log('No category found. Please seed categories first.');
      return;
    }

    const sampleItems = [
      {
        name: 'Rice',
        category_id: category._id,
        item_type: 'weighable',
        base_unit: 'kg',
        package_unit: 'Sack',
        weight_per_package: 50,
        selling_price_per_unit: 2.5,
        purchase_price_per_package: 100,
        minimum_stock: 100
      },
      {
        name: 'Sugar',
        category_id: category._id,
        item_type: 'weighable',
        base_unit: 'kg',
        package_unit: 'Sack',
        weight_per_package: 25,
        selling_price_per_unit: 3.0,
        purchase_price_per_package: 60,
        minimum_stock: 50
      },
      {
        name: 'Cooking Oil',
        category_id: category._id,
        item_type: 'unit_based',
        base_unit: 'l',
        package_unit: 'Bottle',
        units_per_package: 1,
        selling_price_per_unit: 5.0,
        purchase_price_per_package: 4.0,
        minimum_stock: 20
      },
      {
        name: 'Soap',
        category_id: category._id,
        item_type: 'unit_based',
        base_unit: 'pcs',
        package_unit: 'Box',
        units_per_package: 12,
        selling_price_per_unit: 1.5,
        purchase_price_per_package: 15,
        minimum_stock: 10
      }
    ];

    await Item.insertMany(sampleItems);
    console.log('Sample items have been seeded successfully.');
  } catch (err) {
    console.error('Error seeding sample items:', err);
  }
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
    seedCategories(); // Call seeder after connection
    seedPaymentMethods(); // Call payment methods seeder
    seedSampleItems(); // Call sample items seeder
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// --- API Routes ---

// Basic route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching categories' });
  }
});

// Create a new category
app.post('/api/categories', async (req, res) => {
  try {
    const { name, item_type } = req.body || {};
    if (!name || !item_type) {
      return res.status(400).json({ error: 'Missing required fields: name, item_type' });
    }

    // Validate item_type against enum
    const allowedTypes = ['product', 'material', 'equipment', 'consumable', 'other'];
    if (!allowedTypes.includes(item_type)) {
      return res.status(400).json({ error: 'Invalid item_type' });
    }

    const category = new Category({ name: name.trim(), item_type });
    await category.save();
    return res.status(201).json(category);
  } catch (err) {
    // Handle duplicate key error (unique name)
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'Category with this name already exists' });
    }
    console.error('Error creating category:', err);
    return res.status(500).json({ error: 'Server error while creating category' });
  }
});

// Delete a category
app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Missing category id' });
    }

    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' });
    }
    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Error deleting category:', err);
    return res.status(500).json({ error: 'Server error while deleting category' });
  }
});

// Signup route
app.post('/api/auth/signup', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'User registration failed', details: err });
  }
});

// Login route
app.post('/api/auth/login', async (req, res) => {
  try {
    const User = require('./models/User');
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Your account is not active yet. Please contact the administrator.' });
    }
    // Optionally, update last_login
    user.last_login = new Date();
    await user.save();
    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '2h' }
    );
    console.log('[DEBUG] Generated JWT token:', token); // Debug statement
    res.json({ message: 'Login successful', user, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Create a new item
app.post('/api/items', async (req, res) => {
  try {
    const { supplier_name, supplier_contact, ...itemData } = req.body;
    let supplierId;

    if (supplier_name) {
      // Find or create a supplier
      let supplier = await Supplier.findOne({ name: supplier_name });
      
      if (!supplier) {
        supplier = new Supplier({ 
          name: supplier_name, 
          contact_info: supplier_contact || 'Not provided' 
        });
        await supplier.save();
      }
      supplierId = supplier._id;
    }

    const item = new Item({
      ...itemData,
      supplier_id: supplierId
    });

    await item.save();
    res.status(201).json({ message: 'Item added successfully', item });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to add item', details: err });
  }
});

// Get items by item_type
app.get('/api/items', async (req, res) => {
  try {
    const { item_type } = req.query;
    const filter = {};
    if (item_type) filter.item_type = item_type;
    const items = await Item.find(filter).populate('category_id').populate('supplier_id');
    res.status(200).json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching items' });
  }
});

// --- API to get total number of SKUs (items) ---
app.get('/api/items/sku-count', async (req, res) => {
  try {
    const count = await require('./models/Item').countDocuments();
    console.log('[DEBUG] SKU count:', count);
    res.json({ skuCount: count });
  } catch (err) {
    console.error('[DEBUG] Error fetching SKU count:', err);
    res.status(500).json({ error: 'Failed to fetch SKU count' });
  }
});

// --- API to get count of low stock items ---
app.get('/api/items/low-stock-count', async (req, res) => {
  try {
    const count = await require('./models/Item').countDocuments({ $expr: { $lte: ["$total_quantity", "$minimum_stock"] } });
    console.log('[DEBUG] Low stock items count:', count);
    res.json({ lowStockCount: count });
  } catch (err) {
    console.error('[DEBUG] Error fetching low stock count:', err);
    res.status(500).json({ error: 'Failed to fetch low stock count' });
  }
});

// --- API to get count of recently received items (unique items with 'addition' adjustment in last 7 days) ---
app.get('/api/items/recently-received-count', async (req, res) => {
  try {
    const InventoryAdjustment = require('./models/InventoryAdjustment');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentAdjustments = await InventoryAdjustment.aggregate([
      { $match: { adjustment_type: 'addition', adjustment_date: { $gte: sevenDaysAgo } } },
      { $group: { _id: '$item_id' } }
    ]);
    const count = recentAdjustments.length;
    console.log('[DEBUG] Recently received items count:', count);
    res.json({ recentlyReceivedCount: count });
  } catch (err) {
    console.error('[DEBUG] Error fetching recently received count:', err);
    res.status(500).json({ error: 'Failed to fetch recently received count' });
  }
});

// --- API to get stock table data for Stock Analysis modal ---
app.get('/api/items/stock-table', async (req, res) => {
  try {
    const Item = require('./models/Item');
    const InventoryAdjustment = require('./models/InventoryAdjustment');
    const items = await Item.find();
    const results = await Promise.all(items.map(async item => {
      // Find latest 'addition' adjustment for this item
      const lastAddition = await InventoryAdjustment.findOne({ item_id: item._id, adjustment_type: 'addition' })
        .sort({ adjustment_date: -1 });
      const lastReceived = lastAddition ? lastAddition.adjustment_date.toISOString().slice(0, 10) : null;
      const purchasePricePerUnit = item.item_type === 'weighable'
        ? (item.purchase_price_per_package / item.weight_per_package)
        : (item.purchase_price_per_package / item.units_per_package);
      return {
        name: item.name,
        currentStock: item.total_quantity,
        unitPrice: item.selling_price_per_unit,
        totalCost: item.total_quantity * purchasePricePerUnit,
        lastReceived,
        minimum_stock: item.minimum_stock
      };
    }));
    // Sort by totalCost descending
    results.sort((a, b) => b.totalCost - a.totalCost);
    res.json({ items: results });
  } catch (err) {
    console.error('[DEBUG] Error fetching stock table:', err);
    res.status(500).json({ error: 'Failed to fetch stock table' });
  }
});

// --- API to get Top 5 Items by ROI ---
app.get('/api/items/top-roi', async (req, res) => {
  try {
    const Item = require('./models/Item');
    const SaleItem = require('./models/SaleItem');
    // Get all items
    const items = await Item.find();
    // For each item, compute total revenue, total cost, and ROI
    const roiList = [];
    for (const item of items) {
      // Get all sale items for this item
      const saleItems = await SaleItem.find({ item_id: item._id });
      if (!saleItems.length) continue;
      // Total quantity sold
      const totalQty = saleItems.reduce((sum, si) => sum + (si.quantity_sold || 0), 0);
      // Total revenue
      const totalRevenue = saleItems.reduce((sum, si) => sum + ((si.unit_price || 0) * (si.quantity_sold || 0)), 0);
      // Purchase price per unit
      let purchasePricePerUnit = 0;
      if (item.item_type === 'weighable' && item.weight_per_package && item.purchase_price_per_package) {
        purchasePricePerUnit = item.purchase_price_per_package / item.weight_per_package;
      } else if (item.item_type === 'unit_based' && item.units_per_package && item.purchase_price_per_package) {
        purchasePricePerUnit = item.purchase_price_per_package / item.units_per_package;
      } else if (item.purchase_price_per_package) {
        purchasePricePerUnit = item.purchase_price_per_package;
      }
      // Total cost
      const totalCost = purchasePricePerUnit * totalQty;
      // ROI
      let roi = 0;
      if (totalCost > 0) {
        roi = ((totalRevenue - totalCost) / totalCost) * 100;
      }
      roiList.push({ name: item.name, roi: Math.round(roi * 100) / 100 });
    }
    // Sort by ROI descending and return top 5
    roiList.sort((a, b) => b.roi - a.roi);
    res.json({ items: roiList.slice(0, 5) });
  } catch (err) {
    console.error('Error fetching top ROI items:', err);
    res.status(500).json({ error: 'Failed to fetch top ROI items' });
  }
});

// --- API to get Expiring Products within X months ---
app.get('/api/items/expiring', async (req, res) => {
  try {
    const Item = require('./models/Item');
    let months = parseInt(req.query.months, 10);
    if (isNaN(months) || months < 1) months = 2;
    const now = new Date();
    const future = new Date(now);
    future.setMonth(future.getMonth() + months);
    // Find items with expiry_date between now and future
    const items = await Item.find({
      expiry_date: { $gte: now, $lte: future }
    });
    const result = items.map(item => ({
      expiry_date: item.expiry_date,
      name: item.name,
      total_quantity: item.total_quantity,
      total: (item.total_quantity || 0) * (item.selling_price_per_unit || 0)
    }));
    res.json({ items: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expiring products' });
  }
});

// Get item by ID
app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('supplier_id');
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Get all customers
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    res.status(200).json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching customers' });
  }
});

// Get all payment methods
app.get('/api/payment-methods', async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.find({ is_active: true }).sort({ name: 1 });
    res.status(200).json(paymentMethods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching payment methods' });
  }
});

// Create a new customer
app.post('/api/customers', async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).json({ message: 'Customer created successfully', customer });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to create customer', details: err });
  }
});

// Delete a customer by ID
app.delete('/api/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Check if customer has outstanding credit balance
    if (customer.total_credit_balance && customer.total_credit_balance !== 0) {
      return res.status(400).json({ 
        error: 'Cannot delete customer with outstanding credit balance',
        details: `Customer has outstanding credit balance of shs:${customer.total_credit_balance.toLocaleString(undefined, {minimumFractionDigits: 2})}`
      });
    }
    
    await Customer.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (err) {
    console.error('Error deleting customer:', err);
    res.status(500).json({ error: 'Failed to delete customer', details: err.message });
  }
});

// Create a new sale
app.post('/api/sales', async (req, res) => {
  try {
    console.log('Received sale data:', JSON.stringify(req.body, null, 2));
    const { items, ...saleData } = req.body;
    // Convert date string to Date object if provided
    if (saleData.date && typeof saleData.date === 'string') {
      saleData.date = new Date(saleData.date);
    }
    // Set default values
    saleData.customer_type = saleData.customer_type || 'retail';
    saleData.status = saleData.status || 'completed';
    saleData.payment_status = saleData.payment_status || 'paid';
    saleData.discount_amount = saleData.discount_amount || 0;
    saleData.tax_amount = saleData.tax_amount || 0;
    console.log('Sale data after processing:', JSON.stringify(saleData, null, 2));
    console.log('Items data:', JSON.stringify(items, null, 2));
    // Check stock for all items before proceeding
    if (items && items.length > 0) {
      for (const item of items) {
        const dbItem = await Item.findById(item.item_id);
        if (!dbItem) {
          return res.status(400).json({ error: `Item not found: ${item.item_id}` });
        }
        if (dbItem.total_quantity < item.quantity) {
          return res.status(400).json({ error: `Insufficient stock for item: ${dbItem.name}` });
        }
      }
    }
    // Create the sale
    const sale = new Sale(saleData);
    console.log('Sale object created:', sale);
    await sale.save();
    console.log('Sale saved successfully');
    // Create sale items and deduct stock
    if (items && items.length > 0) {
      const saleItems = items.map(item => ({
        sale_id: sale._id,
        item_id: item.item_id,
        quantity_sold: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        discount: item.discount || 0
      }));
      console.log('Sale items to create:', JSON.stringify(saleItems, null, 2));
      // Use Promise.all to create all sale items and update stock
      await Promise.all(saleItems.map(async itemData => {
        const saleItem = new SaleItem(itemData);
        await saleItem.save();
        // Deduct stock
        await Item.findByIdAndUpdate(itemData.item_id, { $inc: { total_quantity: -itemData.quantity_sold } });
      }));
      console.log('Sale items created and stock updated successfully');
    }
    // Populate the sale with items before sending response
    const populatedSale = await Sale.findById(sale._id)
      .populate({
        path: 'items',
        populate: {
          path: 'item_id',
          select: 'name selling_price_per_unit'
        }
      });
    res.status(201).json({ 
      message: 'Sale created successfully', 
      sale: populatedSale,
      itemsCount: items ? items.length : 0
    });
  } catch (err) {
    console.error('Error creating sale:', err);
    console.error('Error details:', err.message);
    if (err.errors) {
      console.error('Validation errors:', Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      })));
    }
    res.status(400).json({ error: 'Failed to create sale', details: err.message });
  }
});

// Get all sales
app.get('/api/sales', async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate('customer_id')
      .populate('payment_method_id')
      .populate('sales_person_id')
      .populate({
        path: 'items',
        populate: {
          path: 'item_id',
          select: 'name selling_price_per_unit base_unit'
        }
      })
      .sort({ createdAt: -1, date: -1 });
    res.status(200).json(sales);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching sales' });
  }
});

// Get today's sales total
app.get('/api/sales/today-total', async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const result = await Sale.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: "$grand_total" } } }
    ]);
    const total = result.length > 0 ? result[0].total : 0;
    res.json({ total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch today\'s sales total' });
  }
});

// Get today's customer count (number of sales today)
app.get('/api/sales/today-customers', async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const count = await Sale.countDocuments({ date: { $gte: start, $lte: end } });
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch today\'s customer count' });
  }
});

// Get today's profits
app.get('/api/sales/today-profits', async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    // Find all sales for today
    const sales = await Sale.find({ date: { $gte: start, $lte: end } }, '_id');
    const saleIds = sales.map(s => s._id);
    if (saleIds.length === 0) return res.json({ profit: 0 });

    // Find all sale items for these sales
    const saleItems = await SaleItem.find({ sale_id: { $in: saleIds } });
    if (saleItems.length === 0) return res.json({ profit: 0 });

    // Get all involved item ids
    const itemIds = [...new Set(saleItems.map(si => si.item_id.toString()))];
    const items = await Item.find({ _id: { $in: itemIds } });
    const itemMap = {};
    items.forEach(item => {
      let purchasePricePerUnit = 0;
      if (item.item_type === 'weighable' && item.weight_per_package && item.purchase_price_per_package) {
        purchasePricePerUnit = item.purchase_price_per_package / item.weight_per_package;
      } else if (item.item_type === 'unit_based' && item.units_per_package && item.purchase_price_per_package) {
        purchasePricePerUnit = item.purchase_price_per_package / item.units_per_package;
      } else if (item.purchase_price_per_package) {
        purchasePricePerUnit = item.purchase_price_per_package;
      }
      itemMap[item._id.toString()] = purchasePricePerUnit;
    });

    // Calculate profit
    let totalProfit = 0;
    saleItems.forEach(si => {
      const cost = (itemMap[si.item_id.toString()] || 0) * si.quantity_sold;
      const revenue = (si.unit_price || 0) * si.quantity_sold;
      totalProfit += (revenue - cost);
    });
    res.json({ profit: Math.round(totalProfit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch today\'s profits' });
  }
});

// Create a new credit transaction
app.post('/api/credit-transactions', async (req, res) => {
  try {
    const creditTransaction = new CreditTransaction(req.body);
    await creditTransaction.save();
    res.status(201).json({ message: 'Credit transaction created successfully', creditTransaction });
  } catch (err) {
    console.error('Error creating credit transaction:', err);
    res.status(400).json({ error: 'Failed to create credit transaction', details: err.message });
  }
});

// Test route to verify server is working
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'Server is working', timestamp: new Date().toISOString() });
});

// Get customer credit accounts overview
app.get('/api/customer-credit-accounts', async (req, res) => {
  try {
    console.log('API called: /api/customer-credit-accounts');
    
    // Get all customers who are credit customers
    const customers = await Customer.find({ is_credit_customer: true });
    console.log('Found customers:', customers.length);
    
    const creditAccounts = await Promise.all(customers.map(async (customer) => {
      console.log('Processing customer:', customer.name, 'with ID:', customer._id);
      
      // Get all credit transactions for this customer
      const creditTransactions = await CreditTransaction.find({ 
        customer_id: customer._id 
      }).sort({ transaction_date: -1 });
      
      console.log('Found transactions for', customer.name, ':', creditTransactions.length);
      
      // Log each transaction for debugging
      creditTransactions.forEach((tx, index) => {
        console.log(`  Transaction ${index + 1}:`, {
          id: tx._id,
          total_amount: tx.total_amount,
          amount_paid: tx.amount_paid,
          payment_status: tx.payment_status,
          transaction_date: tx.transaction_date
        });
      });
      
      // Calculate totals
      const totalCredit = creditTransactions.reduce((sum, transaction) => 
        sum + transaction.total_amount, 0);
      
      const amountPaid = creditTransactions.reduce((sum, transaction) => 
        sum + (transaction.amount_paid || 0), 0);
      
      const balance = totalCredit - amountPaid;
      
      console.log('Calculated totals for', customer.name, ':', {
        totalCredit,
        amountPaid,
        balance
      });
      
      // Get last payment date from Repayment collection
      const lastRepayment = await Repayment.findOne({
        credit_transaction_id: { $in: creditTransactions.map(tx => tx._id) }
      }).sort({ payment_date: -1 });
      const lastPaymentDate = lastRepayment ? lastRepayment.payment_date : null;
      
      // Get most recent transaction date for sorting
      const latestTransactionDate = creditTransactions.length > 0 ? 
        creditTransactions[0].transaction_date : null;
      
      // Determine overall status
      let status = 'No Transactions';
      if (creditTransactions.length > 0) {
        const hasOverdue = creditTransactions.some(t => 
          t.payment_status === 'overdue' || 
          (t.payment_status === 'pending' && new Date() > t.agreed_repayment_date)
        );
        const hasPending = creditTransactions.some(t => 
          t.payment_status === 'pending' && new Date() <= t.agreed_repayment_date
        );
        
        if (hasOverdue) status = 'Overdue';
        else if (hasPending) status = 'Pending';
        else status = 'Paid';
      }
      
      return {
        customer_id: customer._id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: customer.email,
        total_credit: totalCredit,
        amount_paid: amountPaid,
        balance: balance,
        last_payment_date: lastPaymentDate,
        latest_transaction_date: latestTransactionDate,
        status: status,
        transaction_count: creditTransactions.length
      };
    }));
    
    console.log('Returning credit accounts:', creditAccounts.length);
    res.status(200).json(creditAccounts);
  } catch (err) {
    console.error('Error fetching customer credit accounts:', err);
    res.status(500).json({ error: 'Server error while fetching credit accounts' });
  }
});

// Debug endpoint to check all credit transactions
app.get('/api/debug/credit-transactions', async (req, res) => {
  try {
    console.log('Debug endpoint called: /api/debug/credit-transactions');
    
    const allTransactions = await CreditTransaction.find({})
      .populate('customer_id', 'name phone')
      .populate('sale_id', 'invoice_number total_amount')
      .sort({ transaction_date: -1 });
    
    console.log('Total credit transactions found:', allTransactions.length);
    
    const formattedTransactions = allTransactions.map(tx => ({
      id: tx._id,
      customer_name: tx.customer_id?.name || 'Unknown',
      customer_phone: tx.customer_id?.phone || 'Unknown',
      sale_invoice: tx.sale_id?.invoice_number || 'Unknown',
      total_amount: tx.total_amount,
      amount_paid: tx.amount_paid,
      payment_status: tx.payment_status,
      transaction_date: tx.transaction_date,
      agreed_repayment_date: tx.agreed_repayment_date
    }));
    
    res.status(200).json({
      total_count: allTransactions.length,
      transactions: formattedTransactions
    });
  } catch (err) {
    console.error('Error in debug endpoint:', err);
    res.status(500).json({ error: 'Server error in debug endpoint' });
  }
});

// Get customers with credit records (for dropdown)
app.get('/api/customers-with-credit', async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = { is_credit_customer: true };
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const customers = await Customer.find(query)
      .select('name phone email')
      .sort({ name: 1 })
      .limit(20);
    
    res.status(200).json(customers);
  } catch (err) {
    console.error('Error fetching customers with credit:', err);
    res.status(500).json({ error: 'Server error while fetching customers' });
  }
});

// Get customer credit details for payment recording
app.get('/api/customer-credit-details/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // Get customer details
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Get credit transactions for this customer
    const creditTransactions = await CreditTransaction.find({ 
      customer_id: customerId,
      payment_status: { $in: ['pending', 'partially_paid', 'overdue'] }
    })
    .populate('sale_id')
    .sort({ transaction_date: -1 });
    
    // Calculate totals
    const totalOrderBalance = creditTransactions.reduce((sum, transaction) => 
      sum + transaction.total_amount, 0);
    
    const totalPaid = creditTransactions.reduce((sum, transaction) => 
      sum + (transaction.amount_paid || 0), 0);
    
    const outstandingBalance = totalOrderBalance - totalPaid;
    
    // Calculate credit time (days since first credit transaction)
    let creditTime = '-';
    if (creditTransactions.length > 0) {
      // Find the latest agreed_repayment_date
      const latestRepaymentDate = creditTransactions.reduce((latest, tx) => {
        const date = tx.agreed_repayment_date ? new Date(tx.agreed_repayment_date) : null;
        return (!latest || (date && date > latest)) ? date : latest;
      }, null);
      if (latestRepaymentDate) {
        const now = new Date();
        const msPerDay = 1000 * 60 * 60 * 24;
        const daysLeft = Math.ceil((latestRepaymentDate - now) / msPerDay);
        creditTime = daysLeft >= 0 ? `${daysLeft} days` : 'Overdue';
      }
    }
    
    // Format outstanding credit sales for the table
    const outstandingSales = creditTransactions.map(transaction => ({
      id: transaction._id,
      date: transaction.transaction_date.toISOString().split('T')[0],
      total_amount: transaction.total_amount,
      amount_paid: transaction.amount_paid || 0,
      amount_due: transaction.total_amount - (transaction.amount_paid || 0),
      due_date: transaction.agreed_repayment_date.toISOString().split('T')[0],
      status: transaction.payment_status,
      reference: transaction.reference_number
    }));
    
    res.status(200).json({
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email
      },
      credit_summary: {
        total_order_balance: totalOrderBalance,
        total_paid: totalPaid,
        outstanding_balance: outstandingBalance,
        credit_time: creditTime
      },
      outstanding_sales: outstandingSales
    });
  } catch (err) {
    console.error('Error fetching customer credit details:', err);
    res.status(500).json({ error: 'Server error while fetching credit details' });
  }
});

// Record a payment
app.post('/api/repayments', async (req, res) => {
  try {
    const { 
      customer_id, 
      credit_transaction_ids, 
      amount_paid, 
      payment_method_id, 
      payment_date, 
      remarks 
    } = req.body;
    
    console.log('Recording payment:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    if (!customer_id || !credit_transaction_ids || !amount_paid || !payment_method_id || !payment_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate amount
    if (amount_paid <= 0) {
      return res.status(400).json({ error: 'Amount paid must be greater than 0' });
    }
    
    // Get customer
    const customer = await Customer.findById(customer_id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Get credit transactions in the order provided
    const creditTransactions = await Promise.all(
      credit_transaction_ids.map(id => CreditTransaction.findOne({ _id: id, customer_id }))
    );
    
    // Filter out any not found
    const validTransactions = creditTransactions.filter(Boolean);
    if (validTransactions.length === 0) {
      return res.status(404).json({ error: 'No valid credit transactions found' });
    }
    
    // Calculate total outstanding balance for selected transactions
    const totalOutstanding = validTransactions.reduce((sum, transaction) => 
      sum + (transaction.total_amount - (transaction.amount_paid || 0)), 0);
    
    if (amount_paid > totalOutstanding) {
      return res.status(400).json({ error: 'Amount paid exceeds total outstanding balance' });
    }
    
    // Create repayment records in order
    const repayments = [];
    let remainingAmount = amount_paid;
    const updatedTransactions = [];
    
    for (const transaction of validTransactions) {
      if (remainingAmount <= 0) break;
      const outstanding = transaction.total_amount - (transaction.amount_paid || 0);
      const paymentForThisTransaction = Math.min(remainingAmount, outstanding);
      if (paymentForThisTransaction > 0) {
        const repayment = new Repayment({
          credit_transaction_id: transaction._id,
          amount_paid: paymentForThisTransaction,
          payment_date: new Date(payment_date),
          payment_method_id: payment_method_id,
          remarks: remarks,
          recorded_by: req.body.recorded_by || null // You might want to get this from auth
        });
        await repayment.save();
        repayments.push(repayment);
        remainingAmount -= paymentForThisTransaction;
        // Fetch updated transaction
        const updatedTx = await CreditTransaction.findById(transaction._id);
        updatedTransactions.push({
          id: updatedTx._id,
          total_amount: updatedTx.total_amount,
          amount_paid: updatedTx.amount_paid,
          outstanding_balance: updatedTx.total_amount - updatedTx.amount_paid,
          payment_status: updatedTx.payment_status
        });
      }
    }
    
    // Update customer's total credit balance
    await Customer.findByIdAndUpdate(customer_id, {
      $inc: { total_credit_balance: -amount_paid }
    });
    
    console.log(`Updated customer ${customer_id} total_credit_balance by -${amount_paid}`);
    
    res.status(201).json({
      message: 'Payment recorded successfully',
      payment_amount: amount_paid,
      repayments_count: repayments.length,
      remaining_balance: remainingAmount,
      updated_transactions: updatedTransactions
    });
    
  } catch (err) {
    console.error('Error recording payment:', err);
    res.status(400).json({ error: 'Failed to record payment', details: err.message });
  }
});

// Utility endpoint to recalculate customer credit balances
app.post('/api/recalculate-customer-balances', async (req, res) => {
  try {
    console.log('Starting customer credit balance recalculation...');
    
    // Get all credit customers
    const creditCustomers = await Customer.find({ is_credit_customer: true });
    console.log(`Found ${creditCustomers.length} credit customers to recalculate`);
    
    let updatedCount = 0;
    
    for (const customer of creditCustomers) {
      // Get all credit transactions for this customer
      const transactions = await CreditTransaction.find({ 
        customer_id: customer._id,
        payment_status: { $ne: 'paid' } // Only consider unpaid/partially paid transactions
      });
      
      // Calculate total outstanding balance
      const totalOutstanding = transactions.reduce((sum, transaction) => {
        const outstanding = transaction.total_amount - (transaction.amount_paid || 0);
        return sum + outstanding;
      }, 0);
      
      // Update customer's total credit balance
      await Customer.findByIdAndUpdate(customer._id, {
        total_credit_balance: totalOutstanding
      });
      
      console.log(`Customer ${customer.name} (${customer._id}): Updated balance from ${customer.total_credit_balance} to ${totalOutstanding}`);
      updatedCount++;
    }
    
    console.log(`Successfully recalculated balances for ${updatedCount} customers`);
    
    res.status(200).json({
      message: 'Customer credit balances recalculated successfully',
      customers_updated: updatedCount
    });
    
  } catch (err) {
    console.error('Error recalculating customer balances:', err);
    res.status(500).json({ error: 'Failed to recalculate customer balances', details: err.message });
  }
});

// Get credit transactions for a customer
app.get('/api/credit-transactions', async (req, res) => {
  try {
    const { customer_id } = req.query;
    if (!customer_id) {
      return res.status(400).json({ error: 'customer_id is required' });
    }
    const transactions = await CreditTransaction.find({ customer_id }).sort({ transaction_date: -1 });
    res.status(200).json(transactions);
  } catch (err) {
    console.error('Error fetching credit transactions:', err);
    res.status(500).json({ error: 'Server error while fetching credit transactions' });
  }
});

// Create a new commodity request
app.post('/api/commodity-requests', async (req, res) => {
  try {
    const {
      commodity_name,
      quantity,
      customer_id,
      customer_contact,
      status,
      requestType
    } = req.body;

    if (!commodity_name) {
      return res.status(400).json({ error: 'commodity_name is required' });
    }
    if (!customer_id) {
      return res.status(400).json({ error: 'customer_id is required' });
    }

    // Map requestType to product_type
    let product_type = 'other';
    if (requestType === 'Weight-Based') product_type = 'weight_based';
    else if (requestType === 'Unit-Based') product_type = 'unit_based';

    const newRequest = new CommodityRequest({
      commodity_name,
      quantity_desired: quantity,
      customer_id,
      customer_contact,
      status: status || 'pending',
      requested_date: req.body.requested_date || new Date(),
      product_type
    });
    await newRequest.save();
    res.status(201).json({ message: 'Commodity request created successfully', request: newRequest });
  } catch (err) {
    console.error('Error creating commodity request:', err);
    res.status(400).json({ error: 'Failed to create commodity request', details: err.message });
  }
});

// Get customers who have made a commodity request (most recent first, unique)
app.get('/api/commodity-request-customers', async (req, res) => {
  try {
    // Aggregate to get the most recent request per customer
    const recentRequests = await CommodityRequest.aggregate([
      { $sort: { requested_date: -1 } },
      { $group: { _id: "$customer_id", mostRecentRequest: { $first: "$requested_date" } } },
      { $sort: { mostRecentRequest: -1 } }
    ]);
    const customerIds = recentRequests.map(r => r._id);
    // Fetch customers in the same order as customerIds
    const customers = await Customer.find({ _id: { $in: customerIds } }).select('_id name phone');
    // Sort customers to match the order in customerIds
    const customersMap = new Map(customers.map(c => [c._id.toString(), c]));
    const sortedCustomers = customerIds.map(id => customersMap.get(id.toString())).filter(Boolean);
    res.status(200).json(sortedCustomers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch commodity request customers', details: err.message });
  }
});

// Get all commodity requests with customer info (paginated)
app.get('/api/commodity-requests', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const skip = (page - 1) * limit;
    const total = await CommodityRequest.countDocuments();
    const requests = await CommodityRequest.find()
      .sort({ requested_date: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'customer_id', select: 'name phone' });
    res.status(200).json({ requests, total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch commodity requests', details: err.message });
  }
});

// Create a new cash expenditure (expense)
app.post('/api/cash-expenditures', async (req, res) => {
  try {
    const {
      amount,
      purpose,
      expenditure_date,
      expense_type,
      person_responsible,
      payment_source,
      receipt_reference,
      remarks,
      expenditure_category,
      approved_by,
      approval_date,
      status,
      attachment_url
    } = req.body;

    if (!amount || !purpose) {
      return res.status(400).json({ error: 'Amount and purpose are required.' });
    }

    const newExpenditure = new CashExpenditure({
      amount,
      purpose,
      expenditure_date: expenditure_date ? new Date(expenditure_date) : undefined,
      expense_type: expense_type || 'Cash Expenditure',
      person_responsible,
      payment_source,
      receipt_reference,
      remarks,
      expenditure_category,
      approved_by,
      approval_date,
      status,
      attachment_url
    });
    await newExpenditure.save();
    res.status(201).json({ message: 'Expense recorded successfully', expenditure: newExpenditure });
  } catch (err) {
    console.error('Error creating cash expenditure:', err);
    res.status(400).json({ error: 'Failed to record expense', details: err.message });
  }
});

// Add new expense (CashExpenditure)
app.post('/api/expenses', async (req, res) => {
  try {
    const { amount, purpose, date } = req.body;
    // Map frontend fields to model fields
    const expense = new CashExpenditure({
      amount,
      purpose,
      expenditure_date: date,
      expense_type: 'Cash Expenditure',
    });
    await expense.save();
    res.status(201).json({ message: 'Expense added successfully', expense });
  } catch (error) {
    res.status(500).json({ message: 'Error adding expense', error: error.message });
  }
});

// Get all expenses (CashExpenditure) with pagination
app.get('/api/expenses', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const skip = (page - 1) * limit;
    const total = await CashExpenditure.countDocuments();
    const expenses = await CashExpenditure.find({}, {
      amount: 1,
      purpose: 1,
      expenditure_date: 1,
      expense_type: 1,
      status: 1,
      transaction_reference: 1
    })
      .sort({ expenditure_date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    // Format date to only include date part
    expenses.forEach(exp => {
      if (exp.expenditure_date) {
        exp.expenditure_date = exp.expenditure_date.toISOString().split('T')[0];
      }
    });
    res.status(200).json({ expenses, total });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expenses', error: error.message });
  }
});

// Get expenses summary for today, this week, and this month
app.get('/api/expenses/summary', async (req, res) => {
  try {
    const now = new Date();
    // Today
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    // This week (assuming week starts on Sunday)
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - dayOfWeek));
    // This month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Aggregate sums
    const [todaySum] = await CashExpenditure.aggregate([
      { $match: { expenditure_date: { $gte: startOfDay, $lt: endOfDay } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const [weekSum] = await CashExpenditure.aggregate([
      { $match: { expenditure_date: { $gte: startOfWeek, $lt: endOfWeek } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const [monthSum] = await CashExpenditure.aggregate([
      { $match: { expenditure_date: { $gte: startOfMonth, $lt: endOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    res.json({
      today: todaySum ? todaySum.total : 0,
      week: weekSum ? weekSum.total : 0,
      month: monthSum ? monthSum.total : 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expenses summary', error: error.message });
  }
});

// Get summary of commodity requests (total, pending, fulfilled)
app.get('/api/commodity-requests/summary', async (req, res) => {
  try {
    const total = await CommodityRequest.countDocuments();
    const pending = await CommodityRequest.countDocuments({ status: 'pending' });
    const fulfilled = await CommodityRequest.countDocuments({ status: 'fulfilled' });
    res.json({ total, pending, fulfilled });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching commodity requests summary', error: error.message });
  }
});

// Get detailed status summary of commodity requests
app.get('/api/commodity-requests/status-summary', async (req, res) => {
  try {
    const total = await CommodityRequest.countDocuments();
    const pending = await CommodityRequest.countDocuments({ status: 'pending' });
    const approved = await CommodityRequest.countDocuments({ status: 'approved' });
    const rejected = await CommodityRequest.countDocuments({ status: 'rejected' });
    const fulfilled = await CommodityRequest.countDocuments({ status: 'fulfilled' });
    const partially_fulfilled = await CommodityRequest.countDocuments({ status: 'partially_fulfilled' });
    res.json({ total, pending, approved, rejected, fulfilled, partially_fulfilled });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching commodity requests status summary', error: error.message });
  }
});

// Get top 3 most requested items (excluding fulfilled)
app.get('/api/commodity-requests/top-items', async (req, res) => {
  try {
    const topItems = await CommodityRequest.aggregate([
      { $match: { status: { $ne: 'fulfilled' } } },
      { $sort: { requested_date: -1 } },
      { $group: {
        _id: '$commodity_name',
        period: { $first: '$requested_date' },
        count: { $sum: 1 }
      }},
      { $sort: { count: -1, period: -1 } },
      { $limit: 3 },
      { $project: { _id: 0, commodity_name: '$_id', period: 1, count: 1 } }
    ]);
    res.json(topItems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching top requested items', error: error.message });
  }
});

// Update item (increment/replace logic)
app.put('/api/items/:id', async (req, res) => {
  try {
    console.log('Update item request:', req.params.id, req.body);
    
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    console.log('Current item state:', {
      name: item.name,
      item_type: item.item_type,
      total_quantity: item.total_quantity,
      weight_per_package: item.weight_per_package,
      units_per_package: item.units_per_package
    });

    let adjustmentMade = false;
    let adjustmentDetails = null;

    // Handle increment for weighable
    if (item.item_type === 'weighable') {
      const incPackages = parseInt(req.body.increment_initial_packages) || 0;
      const incWeight = parseFloat(req.body.increment_total_weight) || 0;
      if (incPackages > 0 || incWeight > 0) {
        // Create InventoryAdjustment
        const adjustmentQuantity = incWeight > 0 ? incWeight : incPackages * (item.weight_per_package || 1);
        console.log(`Creating adjustment for ${item.name}: quantity=${adjustmentQuantity}, type=addition`);
        
        const adj = new InventoryAdjustment({
          item_id: item._id,
          quantity: adjustmentQuantity,
          adjustment_type: 'addition',
          reason: 'Stock increment via update',
          adjusted_by: req.user ? req.user._id : null, // If you have auth
          status: 'completed',
        });
        await adj.save();
        console.log(`Adjustment created with ID: ${adj._id}`);
        
        try {
          // Ensure InventoryStock is updated/created
          const stockResult = await InventoryStock.processAdjustment(adj);
          console.log(`InventoryStock processed successfully:`, stockResult);
          adjustmentMade = true;
          adjustmentDetails = adj;
        } catch (stockError) {
          console.error('Error processing InventoryStock:', stockError);
          throw new Error(`Failed to update inventory stock: ${stockError.message}`);
        }
        
        // Update Item's total_quantity
        item.total_quantity += incWeight > 0 ? incWeight : incPackages * (item.weight_per_package || 1);
        
        console.log(`Updated item ${item.name}: total_quantity = ${item.total_quantity}`);
      }
      // Optionally, update initial_packages if you store it
      if (incPackages > 0 && item.initial_packages !== undefined) {
        item.initial_packages += incPackages;
      }
    }
    // Handle increment for unit_based
    if (item.item_type === 'unit_based') {
      const incPackages = parseInt(req.body.increment_initial_packages) || 0;
      const incUnits = parseInt(req.body.increment_total_units) || 0;
      if (incPackages > 0 || incUnits > 0) {
        // Create InventoryAdjustment
        const adjustmentQuantity = incUnits > 0 ? incUnits : incPackages * (item.units_per_package || 1);
        console.log(`Creating adjustment for ${item.name}: quantity=${adjustmentQuantity}, type=addition`);
        
        const adj = new InventoryAdjustment({
          item_id: item._id,
          quantity: adjustmentQuantity,
          adjustment_type: 'addition',
          reason: 'Stock increment via update',
          adjusted_by: req.user ? req.user._id : null, // If you have auth
          status: 'completed',
        });
        await adj.save();
        console.log(`Adjustment created with ID: ${adj._id}`);
        
        try {
          // Ensure InventoryStock is updated/created
          const stockResult = await InventoryStock.processAdjustment(adj);
          console.log(`InventoryStock processed successfully:`, stockResult);
          adjustmentMade = true;
          adjustmentDetails = adj;
        } catch (stockError) {
          console.error('Error processing InventoryStock:', stockError);
          throw new Error(`Failed to update inventory stock: ${stockError.message}`);
        }
        
        // Update Item's total_quantity
        item.total_quantity += incUnits > 0 ? incUnits : incPackages * (item.units_per_package || 1);
        
        console.log(`Updated item ${item.name}: total_quantity = ${item.total_quantity}`);
      }
      // Optionally, update initial_packages if you store it
      if (incPackages > 0 && item.initial_packages !== undefined) {
        item.initial_packages += incPackages;
      }
    }
    // Replace minimum_stock and expiry_date if provided
    if (req.body.minimum_stock !== undefined) {
      item.minimum_stock = req.body.minimum_stock;
    }
    if (req.body.expiry_date !== undefined) {
      item.expiry_date = req.body.expiry_date;
    }
    await item.save();
    console.log(`Final item state: total_quantity = ${item.total_quantity}`);
    
    // Verify InventoryStock was created/updated
    const stock = await InventoryStock.findOne({ item_id: item._id });
    console.log(`InventoryStock after update:`, stock ? {
      full_packages: stock.full_packages,
      partial_quantity: stock.partial_quantity,
      last_updated: stock.last_updated
    } : 'Not found');
    
    res.json({ message: 'Item updated successfully', item, adjustment: adjustmentDetails });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Get the most recent InventoryStock for a given item_id
app.get('/api/inventory-stock', async (req, res) => {
  try {
    const { item_id } = req.query;
    if (!item_id) {
      return res.status(400).json({ error: 'item_id is required' });
    }
    // Get the most recent InventoryStock for the item
    const stock = await InventoryStock.findOne({ item_id }).sort({ last_updated: -1 });
    if (!stock) {
      return res.status(404).json({ error: 'No inventory stock found for this item' });
    }
    res.json(stock);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Update the full_packages for a given item_id in InventoryStock
app.put('/api/inventory-stock/:item_id', async (req, res) => {
  try {
    const { item_id } = req.params;
    const { full_packages, total_quantity } = req.body;
    if (typeof full_packages !== 'number' || full_packages < 0) {
      return res.status(400).json({ error: 'full_packages must be a non-negative number' });
    }
    
    // Ensure InventoryStock record exists
    let stock = await InventoryStock.findOne({ item_id });
    if (!stock) {
      stock = new InventoryStock({ 
        item_id, 
        full_packages: 0, 
        partial_quantity: 0,
        last_updated: new Date()
      });
    }
    
    // Update the stock
    stock.full_packages = full_packages;
    stock.last_updated = new Date();
    await stock.save();
    
    // Create a correction InventoryAdjustment
    const item = await Item.findById(item_id);
    let quantity = 0;
    if (item.item_type === 'weighable') {
      quantity = typeof total_quantity === 'number' ? total_quantity : (item.weight_per_package * full_packages);
    } else if (item.item_type === 'unit_based') {
      quantity = typeof total_quantity === 'number' ? total_quantity : (item.units_per_package * full_packages);
    } else {
      quantity = full_packages;
    }
    await InventoryAdjustment.create({
      item_id,
      quantity,
      adjustment_type: 'correction',
      reason: 'Stock correction via edit',
      status: 'completed',
      adjustment_date: new Date()
    });
    res.json(stock);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Get all unique expense purposes
app.get('/api/expenses/purposes', async (req, res) => {
  try {
    const purposes = await CashExpenditure.distinct('purpose');
    res.status(200).json({ purposes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch purposes', details: err.message });
  }
});

// Get all unique request statuses
app.get('/api/commodity-requests/statuses', async (req, res) => {
  try {
    const statuses = await CommodityRequest.distinct('status');
    res.status(200).json({ statuses });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch statuses', details: err.message });
  }
});

// Get all unique credit transaction payment statuses
app.get('/api/credit-transactions/statuses', async (req, res) => {
  try {
    const statuses = await CreditTransaction.distinct('payment_status');
    res.status(200).json({ statuses });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment statuses', details: err.message });
  }
});

// Test endpoint to manually create InventoryStock record
app.post('/api/inventory-stock/test/:item_id', async (req, res) => {
  try {
    const { item_id } = req.params;
    const { quantity } = req.body;
    
    const item = await Item.findById(item_id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Create a test adjustment
    const adj = new InventoryAdjustment({
      item_id: item._id,
      quantity: quantity || 50,
      adjustment_type: 'addition',
      reason: 'Test adjustment',
      status: 'completed',
    });
    await adj.save();
    
    // Process the adjustment
    const stockResult = await InventoryStock.processAdjustment(adj);
    
    res.json({ 
      message: 'Test completed',
      adjustment: adj,
      stock: stockResult
    });
  } catch (err) {
    res.status(500).json({ error: 'Test failed', details: err.message });
  }
});

// Update an expense (amount and purpose)
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { amount, purpose } = req.body;
    const updated = await CashExpenditure.findByIdAndUpdate(
      req.params.id,
      { amount, purpose },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Expense not found' });
    res.json({ message: 'Expense updated successfully', expense: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update expense', details: error.message });
  }
});

// Delete an expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const deleted = await CashExpenditure.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Expense not found' });
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense', details: error.message });
  }
});

// Update a commodity request
app.put('/api/commodity-requests/:id', async (req, res) => {
  try {
    const {
      commodity_name,
      quantity,
      customer_id,
      customer_contact,
      status,
      requestType,
      requested_date
    } = req.body;

    // Map requestType to product_type
    let product_type = undefined;
    if (requestType === 'Weight-Based') product_type = 'weight_based';
    else if (requestType === 'Unit-Based') product_type = 'unit_based';

    const update = {
      commodity_name,
      quantity_desired: quantity,
      customer_id,
      customer_contact,
      status,
      requested_date,
    };
    if (product_type) update.product_type = product_type;
    // Remove undefined fields
    Object.keys(update).forEach(key => update[key] === undefined && delete update[key]);

    const updated = await CommodityRequest.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Request not found' });
    res.json({ message: 'Request updated successfully', request: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update request', details: error.message });
  }
});

// Get a single commodity request by id
app.get('/api/commodity-requests/:id', async (req, res) => {
  try {
    const request = await CommodityRequest.findById(req.params.id).populate({ path: 'customer_id', select: 'name phone' });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch request', details: err.message });
  }
});

// Delete a commodity request
app.delete('/api/commodity-requests/:id', async (req, res) => {
  try {
    const deleted = await CommodityRequest.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Request not found' });
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete request', details: error.message });
  }
});

// Get profit report for a specific date
app.get('/api/sales/profit-report', async (req, res) => {
  try {
    const dateStr = req.query.date;
    if (!dateStr) return res.status(400).json({ error: 'Date is required' });
    const date = new Date(dateStr);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    // Find all sales for the date
    const sales = await Sale.find({ date: { $gte: start, $lte: end } }, '_id');
    const saleIds = sales.map(s => s._id);
    if (saleIds.length === 0) return res.json({ items: [], totalCost: 0, totalRevenue: 0, profit: 0 });

    // Find all sale items for these sales
    const saleItems = await SaleItem.find({ sale_id: { $in: saleIds } });
    if (saleItems.length === 0) return res.json({ items: [], totalCost: 0, totalRevenue: 0, profit: 0 });

    // Get all involved item ids
    const itemIds = [...new Set(saleItems.map(si => si.item_id.toString()))];
    const items = await Item.find({ _id: { $in: itemIds } });
    const itemMap = {};
    items.forEach(item => {
      let purchasePricePerUnit = 0;
      if (item.item_type === 'weighable' && item.weight_per_package && item.purchase_price_per_package) {
        purchasePricePerUnit = item.purchase_price_per_package / item.weight_per_package;
      } else if (item.item_type === 'unit_based' && item.units_per_package && item.purchase_price_per_package) {
        purchasePricePerUnit = item.purchase_price_per_package / item.units_per_package;
      } else if (item.purchase_price_per_package) {
        purchasePricePerUnit = item.purchase_price_per_package;
      }
      itemMap[item._id.toString()] = {
        name: item.name,
        buyingPrice: purchasePricePerUnit,
        sellingPrice: item.selling_price_per_unit || 0
      };
    });

    // Aggregate by product
    const productMap = {};
    saleItems.forEach(si => {
      const itemInfo = itemMap[si.item_id.toString()];
      if (!itemInfo) return;
      if (!productMap[si.item_id.toString()]) {
        productMap[si.item_id.toString()] = {
          product: itemInfo.name,
          quantity: 0,
          buyingPrice: itemInfo.buyingPrice,
          sellingPrice: si.unit_price || itemInfo.sellingPrice,
          totalCost: 0,
          totalRevenue: 0,
          profit: 0
        };
      }
      const row = productMap[si.item_id.toString()];
      row.quantity += si.quantity_sold;
      row.totalCost += itemInfo.buyingPrice * si.quantity_sold;
      row.totalRevenue += (si.unit_price || itemInfo.sellingPrice) * si.quantity_sold;
      row.profit += ((si.unit_price || itemInfo.sellingPrice) - itemInfo.buyingPrice) * si.quantity_sold;
    });
    const itemsArr = Object.values(productMap);
    const totalCost = itemsArr.reduce((sum, r) => sum + r.totalCost, 0);
    const totalRevenue = itemsArr.reduce((sum, r) => sum + r.totalRevenue, 0);
    const profit = itemsArr.reduce((sum, r) => sum + r.profit, 0);
    res.json({ items: itemsArr, totalCost: Math.round(totalCost * 100) / 100, totalRevenue: Math.round(totalRevenue * 100) / 100, profit: Math.round(profit * 100) / 100 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profit report' });
  }
});

// Get customers and their purchase amounts for a specific date
app.get('/api/sales/customers-report', async (req, res) => {
  try {
    const dateStr = req.query.date;
    if (!dateStr) return res.status(400).json({ error: 'Date is required' });
    const date = new Date(dateStr);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    // Find all sales for the date
    const sales = await Sale.find({ date: { $gte: start, $lte: end } });
    if (!sales.length) return res.json({ customers: [] });

    // Aggregate by customer name
    const customerMap = {};
    sales.forEach(sale => {
      const name = (sale.customer_info && sale.customer_info.name) ? sale.customer_info.name : 'Unknown Customer';
      if (!customerMap[name]) customerMap[name] = 0;
      customerMap[name] += sale.grand_total || 0;
    });
    const customers = Object.entries(customerMap).map(([name, amount]) => ({ name, amount }));
    res.json({ customers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch customers report' });
  }
});

// Get sales report for a specific date
app.get('/api/sales/sales-report', async (req, res) => {
  try {
    const dateStr = req.query.date;
    if (!dateStr) return res.status(400).json({ error: 'Date is required' });
    const date = new Date(dateStr);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    // Find all sales for the date, populate items and item details
    const sales = await Sale.find({ date: { $gte: start, $lte: end } })
      .populate({
        path: 'items',
        populate: {
          path: 'item_id',
          select: 'name base_unit'
        }
      });

    // Format the response
    const salesArr = sales.map(sale => ({
      customerName: (sale.customer_info && sale.customer_info.name) ? sale.customer_info.name : 'Unknown Customer',
      items: (sale.items || []).map(si => ({
        name: si.item_id && si.item_id.name ? si.item_id.name : 'Unknown',
        quantity: si.quantity_sold,
        unit: si.item_id && si.item_id.base_unit ? si.item_id.base_unit : ''
      })),
      totalAmount: sale.grand_total || 0
    }));
    res.json({ sales: salesArr });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sales report' });
  }
});

// Get paginated recent sales with profit
app.get('/api/sales/recent', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const skip = (page - 1) * limit;
    let filter = {};
    
    // Handle year and month filtering
    const { year, month } = req.query;
    if (year && month) {
      // Filter by specific year and month
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 1);
      filter.date = { $gte: start, $lt: end };
      console.log('Filtering recent sales by year and month:', { year, month, start, end });
    } else if (year) {
      // Filter by year only
      const start = new Date(Number(year), 0, 1);
      const end = new Date(Number(year) + 1, 0, 1);
      filter.date = { $gte: start, $lt: end };
      console.log('Filtering recent sales by year:', { year, start, end });
    } else if (month) {
      // Filter by month only (current year)
      const currentYear = new Date().getFullYear();
      const start = new Date(currentYear, Number(month) - 1, 1);
      const end = new Date(currentYear, Number(month), 1);
      filter.date = { $gte: start, $lt: end };
      console.log('Filtering recent sales by month:', { month, start, end });
    } else if (req.query.date) {
      // Legacy date filtering (specific date)
      const date = new Date(req.query.date);
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }
    const total = await Sale.countDocuments(filter);
    const sales = await Sale.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'items',
        populate: {
          path: 'item_id',
          select: 'name base_unit purchase_price_per_package weight_per_package units_per_package item_type'
        }
      })
      .populate('payment_method_id')
      .populate('customer_id'); // <-- populate customer
    // Calculate profit for each sale
    const salesArr = await Promise.all(sales.map(async sale => {
      let profit = 0;
      const itemsArr = (sale.items || []).map(si => {
        let purchasePricePerUnit = 0;
        const item = si.item_id;
        if (item) {
          if (item.item_type === 'weighable' && item.weight_per_package && item.purchase_price_per_package) {
            purchasePricePerUnit = item.purchase_price_per_package / item.weight_per_package;
          } else if (item.item_type === 'unit_based' && item.units_per_package && item.purchase_price_per_package) {
            purchasePricePerUnit = item.purchase_price_per_package / item.units_per_package;
          } else if (item.purchase_price_per_package) {
            purchasePricePerUnit = item.purchase_price_per_package;
          }
        }
        const itemProfit = ((si.unit_price || 0) - purchasePricePerUnit) * (si.quantity_sold || 0);
        profit += itemProfit;
        return {
          name: item && item.name ? item.name : 'Unknown',
          quantity: si.quantity_sold,
          unit: item && item.base_unit ? item.base_unit : ''
        };
      });
      // Determine customer name
      let customerName = (sale.customer_info && sale.customer_info.name) ? sale.customer_info.name : '';
      if (!customerName && sale.customer_id && sale.customer_id.name) {
        customerName = sale.customer_id.name;
      }
      if (!customerName) {
        customerName = 'Unknown Customer';
      }
      return {
        customerName,
        items: itemsArr,
        date: sale.date ? sale.date.toISOString().split('T')[0] : '',
        total: sale.grand_total || 0,
        profit: Math.round(profit * 100) / 100,
        paymentMethodName: sale.payment_method_id && sale.payment_method_id.name ? sale.payment_method_id.name : 'N/A'
      };
    }));
    res.json({ sales: salesArr, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch recent sales' });
  }
});

// Get daily sales totals for the last N days, ending at endDate (default today)
app.get('/api/sales/daily-totals', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    let end = req.query.endDate ? new Date(req.query.endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));
    // Group sales by day
    const result = await Sale.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$date" }
        },
        total: { $sum: "$grand_total" }
      }},
      { $sort: { _id: -1 } }
    ]);
    // Fill in missing days with 0
    const totalsMap = {};
    result.forEach(r => { totalsMap[r._id] = r.total; });
    const daysArr = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(end);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      daysArr.push({ date: key, total: totalsMap[key] || 0 });
    }
    res.json({ days: daysArr });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch daily sales totals' });
  }
});

// Get all possible 7-day date ranges for sales
app.get('/api/sales/date-ranges', async (req, res) => {
  try {
    const firstSale = await Sale.findOne().sort({ date: 1 });
    const lastSale = await Sale.findOne().sort({ date: -1 });
    if (!firstSale || !lastSale) return res.json({ ranges: [] });
    const startDate = new Date(firstSale.date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(lastSale.date);
    endDate.setHours(23, 59, 59, 999);
    const ranges = [];
    let rangeEnd = new Date(endDate);
    while (rangeEnd >= startDate) {
      let rangeStart = new Date(rangeEnd);
      rangeStart.setDate(rangeEnd.getDate() - 6);
      if (rangeStart < startDate) rangeStart = new Date(startDate);
      ranges.push({
        start: rangeStart.toISOString().slice(0, 10),
        end: rangeEnd.toISOString().slice(0, 10)
      });
      rangeEnd.setDate(rangeEnd.getDate() - 7);
    }
    res.json({ ranges });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute date ranges' });
  }
});

// Test endpoint to check if backend is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!', timestamp: new Date().toISOString() });
});

// Debug endpoint to check sales data
app.get('/api/debug/sales-data', async (req, res) => {
  try {
    const Sale = require('./models/Sale');
    const SaleItem = require('./models/SaleItem');
    const Item = require('./models/Item');
    
    const totalSales = await Sale.countDocuments();
    const totalSaleItems = await SaleItem.countDocuments();
    const totalItems = await Item.countDocuments();
    
    // Get a sample of recent sales
    const recentSales = await Sale.find().sort({ date: -1 }).limit(5);
    const recentSaleItems = await SaleItem.find().limit(5);
    
    res.json({
      totalSales,
      totalSaleItems,
      totalItems,
      recentSales: recentSales.map(s => ({ id: s._id, date: s.date, total: s.grand_total })),
      recentSaleItems: recentSaleItems.map(si => ({ 
        id: si._id, 
        sale_id: si.sale_id, 
        item_id: si.item_id, 
        quantity: si.quantity_sold,
        price: si.total_price 
      }))
    });
  } catch (err) {
    console.error('Debug endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get top selling items (for analytics)
app.get('/api/sales/top-items', async (req, res) => {
  try {
    console.log('Top selling items API called with query:', req.query);
    
    const alpha = 1;
    const beta = 0.001;
    const { year, month } = req.query;
    let dateFilter = {};
    
    if (year && month) {
      // Calculate start and end dates for the month
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 1);
      dateFilter = { createdAt: { $gte: start, $lt: end } };
      console.log('Filtering by SaleItem createdAt range:', { start, end });
    } else if (year) {
      // Filter by year only
      const start = new Date(Number(year), 0, 1);
      const end = new Date(Number(year) + 1, 0, 1);
      dateFilter = { createdAt: { $gte: start, $lt: end } };
      console.log('Filtering by SaleItem createdAt year:', { start, end });
    } else if (month) {
      // Filter by month only (current year)
      const currentYear = new Date().getFullYear();
      const start = new Date(currentYear, Number(month) - 1, 1);
      const end = new Date(currentYear, Number(month), 1);
      dateFilter = { createdAt: { $gte: start, $lt: end } };
      console.log('Filtering by SaleItem createdAt month:', { start, end });
    }
    
    // First, let's check if we have any SaleItem data at all
    const totalSaleItems = await SaleItem.countDocuments();
    console.log('Total SaleItem documents:', totalSaleItems);
    
    if (totalSaleItems === 0) {
      console.log('No SaleItem documents found');
      return res.json([]);
    }
    
    // Let's also check if there are any SaleItem documents with valid item_id references
    const validSaleItems = await SaleItem.countDocuments({ item_id: { $exists: true, $ne: null } });
    console.log('SaleItem documents with valid item_id:', validSaleItems);
    
    // Check filtered documents count
    if (Object.keys(dateFilter).length > 0) {
      const filteredCount = await SaleItem.countDocuments(dateFilter);
      console.log('SaleItem documents matching date filter:', filteredCount);
    }
    
    const aggregationPipeline = [
      // Add date filter if specified
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
      {
        $group: {
          _id: '$item_id',
          quantity: { $sum: '$quantity_sold' },
          cost: { $sum: '$total_price' }
        }
      },
      {
        $addFields: {
          score: { $add: [
            { $multiply: ['$quantity', alpha] },
            { $multiply: ['$cost', beta] }
          ] }
        }
      },
      { $sort: { score: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'items',
          localField: '_id',
          foreignField: '_id',
          as: 'item_info'
        }
      },
      { $unwind: '$item_info' },
      {
        $project: {
          _id: 0,
          item_id: '$_id',
          item_name: '$item_info.name',
          quantity: '$quantity',
          cost: '$cost',
          score: 1
        }
      }
    ];
    
    console.log('Aggregation pipeline:', JSON.stringify(aggregationPipeline, null, 2));
    
    const topItems = await SaleItem.aggregate(aggregationPipeline);
    console.log('Top items result:', topItems);
    
    res.json(topItems);
  } catch (err) {
    console.error('Error in top selling items API:', err);
    res.status(500).json({ error: 'Failed to fetch top selling items', details: err.message });
  }
});

// Get monthly sales totals for all months (completed sales only)
app.get('/api/sales/monthly-totals', async (req, res) => {
  try {
    let matchStage = { status: 'completed' };
    
    // Handle year and month filtering
    const { year, month } = req.query;
    if (year && month) {
      // Filter by specific year and month
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 1);
      matchStage.date = { $gte: start, $lt: end };
      console.log('Filtering monthly totals by year and month:', { year, month, start, end });
    } else if (year) {
      // Filter by year only
      const start = new Date(Number(year), 0, 1);
      const end = new Date(Number(year) + 1, 0, 1);
      matchStage.date = { $gte: start, $lt: end };
      console.log('Filtering monthly totals by year:', { year, start, end });
    } else if (month) {
      // Filter by month only (current year)
      const currentYear = new Date().getFullYear();
      const start = new Date(currentYear, Number(month) - 1, 1);
      const end = new Date(currentYear, Number(month), 1);
      matchStage.date = { $gte: start, $lt: end };
      console.log('Filtering monthly totals by month:', { month, start, end });
    }
    
    const result = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          total: { $sum: "$grand_total" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    // Format as [{ month: 'YYYY-MM', total: ... }, ...]
    const months = result.map(r => ({ month: r._id, total: r.total }));
    res.json({ months });
  } catch (err) {
    console.error('Error fetching monthly sales totals:', err);
    res.status(500).json({ error: 'Failed to fetch monthly sales totals' });
  }
});

// Get count of active credit customers (with at least one active credit transaction)
app.get('/api/credit-customers/count', async (req, res) => {
  try {
    // Find unique customer_ids in CreditTransaction with non-paid status
    const activeCreditCustomerIds = await CreditTransaction.distinct('customer_id', { payment_status: { $ne: 'paid' } });
    console.log('Active credit customer IDs:', activeCreditCustomerIds);
    // Filter for active customers
    const count = await Customer.countDocuments({ _id: { $in: activeCreditCustomerIds }, is_active: true });
    console.log('Active credit customers count:', count);
    res.status(200).json({ count });
  } catch (err) {
    console.error('Error in /api/credit-customers/count:', err);
    res.status(500).json({ error: 'Failed to fetch active credit customers count', details: err.message });
  }
});

// Get total outstanding amount for all active credit customers
app.get('/api/credit-customers/total-outstanding', async (req, res) => {
  try {
    // Find unique customer_ids in CreditTransaction with non-paid status
    const activeCreditCustomerIds = await CreditTransaction.distinct('customer_id', { payment_status: { $ne: 'paid' } });
    // Get all active customers
    const customers = await Customer.find({ _id: { $in: activeCreditCustomerIds }, is_active: true });
    // For each customer, sum their non-paid credit transactions
    let totalOutstanding = 0;
    for (const customer of customers) {
      const transactions = await CreditTransaction.find({ customer_id: customer._id, payment_status: { $ne: 'paid' } });
      for (const tx of transactions) {
        totalOutstanding += (tx.total_amount - (tx.amount_paid || 0));
      }
    }
    res.status(200).json({ totalOutstanding });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch total outstanding', details: err.message });
  }
});

// Get total overdue amount for all active credit customers
app.get('/api/credit-customers/overdue-amount', async (req, res) => {
  try {
    const now = new Date();
    // Find all overdue credit transactions (not paid, due date passed)
    const overdueTransactions = await CreditTransaction.find({
      payment_status: { $ne: 'paid' },
      agreed_repayment_date: { $lt: now }
    });
    // Get only active customers
    const customerIds = overdueTransactions.map(tx => tx.customer_id);
    const activeCustomers = await Customer.find({ _id: { $in: customerIds }, is_active: true });
    const activeCustomerIds = new Set(activeCustomers.map(c => c._id.toString()));
    // Sum overdue balances for active customers
    let totalOverdue = 0;
    for (const tx of overdueTransactions) {
      if (activeCustomerIds.has(tx.customer_id.toString())) {
        totalOverdue += (tx.total_amount - (tx.amount_paid || 0));
      }
    }
    res.status(200).json({ totalOverdue });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch overdue amount', details: err.message });
  }
});

// Get all credit transactions with customer and sale info (including sale items and item details)
app.get('/api/credit-transactions/all', async (req, res) => {
  try {
    const transactions = await CreditTransaction.find()
      .populate({ path: 'customer_id', select: 'name phone email' })
      .populate({ 
        path: 'sale_id', 
        select: 'items',
        populate: {
          path: 'items',
          populate: { path: 'item_id', select: 'name' }
        }
      });
    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch credit transactions', details: err.message });
  }
});

// Get monthly totals for credit issued and payments
app.get('/api/credit/monthly-totals', async (req, res) => {
  try {
    // Aggregate credit issued by month
    const issued = await CreditTransaction.aggregate([
      {
        $group: {
          _id: { year: { $year: "$transaction_date" }, month: { $month: "$transaction_date" } },
          totalIssued: { $sum: "$total_amount" }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    // Aggregate payments by month
    const payments = await Repayment.aggregate([
      {
        $group: {
          _id: { year: { $year: "$payment_date" }, month: { $month: "$payment_date" } },
          totalPaid: { $sum: "$amount_paid" }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    // Merge results by month
    const resultMap = {};
    issued.forEach(i => {
      const key = `${i._id.year}-${String(i._id.month).padStart(2, '0')}`;
      resultMap[key] = { year: i._id.year, month: i._id.month, issued: i.totalIssued, paid: 0 };
    });
    payments.forEach(p => {
      const key = `${p._id.year}-${String(p._id.month).padStart(2, '0')}`;
      if (!resultMap[key]) resultMap[key] = { year: p._id.year, month: p._id.month, issued: 0, paid: 0 };
      resultMap[key].paid = p.totalPaid;
    });
    // Convert to sorted array
    const result = Object.values(resultMap).sort((a, b) => (a.year - b.year) || (a.month - b.month));
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch monthly credit totals', details: err.message });
  }
});

// --- API to get Stock Inventory Value ---
// FIXED: Now uses Item.total_quantity instead of InventoryStock records
// This ensures the stock value reflects actual current stock after sales and deductions
app.get('/api/stock-inventory-value', async (req, res) => {
  try {
    // Get all items with their current total_quantity (which is properly updated with sales/deductions)
    const items = await Item.find();
    let totalStockValue = 0;
    let latestDate = new Date(); // Use current date as latest

    for (const item of items) {
      if (!item.total_quantity || item.total_quantity <= 0) continue;
      
      let itemValue = 0;
      if (item.item_type === 'weighable') {
        // For weighable items, total_quantity is in kg
        const pricePerKg = item.purchase_price_per_package / item.weight_per_package;
        itemValue = item.total_quantity * pricePerKg;
      } else if (item.item_type === 'unit_based') {
        // For unit-based items, total_quantity is in units
        const pricePerUnit = item.purchase_price_per_package / item.units_per_package;
        itemValue = item.total_quantity * pricePerUnit;
      } else {
        // Fallback for other item types
        itemValue = item.total_quantity * item.purchase_price_per_package;
      }
      totalStockValue += itemValue;
    }
    
    res.json({
      totalStockValue,
      latestDate: latestDate.toISOString().slice(0, 10)
    });
  } catch (err) {
    console.error('Error calculating stock inventory value:', err);
    res.status(500).json({ error: 'Failed to calculate stock inventory value' });
  }
});

// --- API to get Inventory Details for a specific date ---
// FIXED: Now uses Item.total_quantity instead of InventoryStock records
// This ensures the inventory details reflect actual current stock after sales and deductions
app.get('/api/inventory-details', async (req, res) => {
  try {
    const dateParam = req.query.date;
    let targetDate = dateParam ? new Date(dateParam) : null;
    if (targetDate) {
      // Set to end of day for inclusivity
      targetDate.setHours(23, 59, 59, 999);
    }

    // Get all items with their current total_quantity (which reflects the actual current stock)
    const items = await Item.find();
    const results = [];

    for (const item of items) {
      // Use current total_quantity which is properly updated with sales/deductions
      if (!item.total_quantity || item.total_quantity <= 0) continue;
      
      let amount = 0;
      let quantity = item.total_quantity;
      
      if (item.item_type === 'weighable') {
        // For weighable items, total_quantity is in kg
        const pricePerKg = item.purchase_price_per_package / item.weight_per_package;
        amount = quantity * pricePerKg;
      } else if (item.item_type === 'unit_based') {
        // For unit-based items, total_quantity is in units
        const pricePerUnit = item.purchase_price_per_package / item.units_per_package;
        amount = quantity * pricePerUnit;
      } else {
        // Fallback for other item types
        amount = quantity * item.purchase_price_per_package;
      }
      
      if (amount > 0) {
        results.push({ name: item.name, quantity, amount });
      }
    }
    
    res.json({ details: results });
  } catch (err) {
    console.error('Error fetching inventory details:', err);
    res.status(500).json({ error: 'Failed to fetch inventory details' });
  }
});

// --- API to get Today's Expenses ---
app.get('/api/todays-expenses', async (req, res) => {
  try {
    const today = new Date();
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0));
    const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999));
    const expenses = await CashExpenditure.aggregate([
      {
        $match: {
          expenditure_date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);
    const totalExpenses = expenses.length > 0 ? expenses[0].total : 0;
    res.json({ totalExpenses });
  } catch (err) {
    console.error('Error fetching today\'s expenses:', err);
    res.status(500).json({ error: 'Failed to fetch today\'s expenses' });
  }
});

// --- API to get Expenses Details for a specific date ---
app.get('/api/expenses-details', async (req, res) => {
  try {
    let dateParam = req.query.date;
    let targetDate = dateParam ? new Date(dateParam) : new Date();
    const start = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 0, 0, 0, 0));
    const end = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 23, 59, 59, 999));
    const expenses = await CashExpenditure.find({
      expenditure_date: { $gte: start, $lte: end }
    }).sort({ expenditure_date: -1 });
    const details = expenses.map(e => ({ purpose: e.purpose, amount: e.amount }));
    res.json({ details });
  } catch (err) {
    console.error('Error fetching expenses details:', err);
    res.status(500).json({ error: 'Failed to fetch expenses details' });
  }
});

// --- API to get Today's Cash Available (sum of sales for today) ---
app.get('/api/todays-cash-available', async (req, res) => {
  try {
    const today = new Date();
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0));
    const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999));
    const sales = await Sale.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$grand_total" }
        }
      }
    ]);
    const totalCashAvailable = sales.length > 0 ? sales[0].total : 0;
    res.json({ totalCashAvailable });
  } catch (err) {
    console.error('Error fetching today\'s cash available:', err);
    res.status(500).json({ error: 'Failed to fetch today\'s cash available' });
  }
});

// --- API to get Cash Available Details for a specific date ---
app.get('/api/cash-available-details', async (req, res) => {
  try {
    let dateParam = req.query.date;
    let targetDate = dateParam ? new Date(dateParam) : new Date();
    const start = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 0, 0, 0, 0));
    const end = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 23, 59, 59, 999));
    // Find all completed sales for the date
    const sales = await Sale.find({
      date: { $gte: start, $lte: end },
      status: 'completed'
    }).sort({ date: -1 });
    // For each sale, get items and customer name
    const results = [];
    for (const sale of sales) {
      // Get customer name
      let customerName = '';
      if (sale.customer_info && sale.customer_info.name) {
        customerName = sale.customer_info.name;
      } else if (sale.customer_id) {
        const customer = await Customer.findById(sale.customer_id);
        customerName = customer ? customer.name : '';
      }
      // Get items for this sale
      const saleItems = await SaleItem.find({ sale_id: sale._id }).populate('item_id');
      const itemsStr = saleItems.map(item => {
        const itemName = item.item_id && item.item_id.name ? item.item_id.name : 'Unknown';
        return `${itemName} (${item.quantity_sold})`;
      }).join(', ');
      results.push({
        customerName,
        items: itemsStr,
        totalAmount: sale.grand_total
      });
    }
    res.json({ details: results });
  } catch (err) {
    console.error('Error fetching cash available details:', err);
    res.status(500).json({ error: 'Failed to fetch cash available details' });
  }
});

// --- API to get Cash Flow Overview for the last 7 days ---
app.get('/api/cash-flow-overview', async (req, res) => {
  try {
    const days = 7;
    const labels = [];
    const cashIn = [];
    const cashOut = [];
    const today = new Date();
    // Go from oldest to newest
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
      const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
      const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
      const label = d.toISOString().slice(0, 10);
      labels.push(label);
      // Cash In: sum of sales (grand_total) for the day
      const sales = await Sale.aggregate([
        { $match: { date: { $gte: start, $lte: end }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: "$grand_total" } } }
      ]);
      cashIn.push(sales.length > 0 ? sales[0].total : 0);
      // Cash Out: sum of expenses for the day
      const expenses = await CashExpenditure.aggregate([
        { $match: { expenditure_date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      cashOut.push(expenses.length > 0 ? expenses[0].total : 0);
    }
    res.json({ labels, cashIn, cashOut });
  } catch (err) {
    console.error('Error fetching cash flow overview:', err);
    res.status(500).json({ error: 'Failed to fetch cash flow overview' });
  }
});

// --- API to get Total Revenue for the current or selected month ---
app.get('/api/financial-report/total-revenue', async (req, res) => {
  try {
    let { month } = req.query;
    let start, end;
    if (month) {
      const [year, m] = month.split('-');
      start = new Date(Date.UTC(Number(year), Number(m) - 1, 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(Number(year), Number(m), 0, 23, 59, 59, 999));
    } else {
      const now = new Date();
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    }
    const sales = await Sale.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$grand_total" }
        }
      }
    ]);
    const totalRevenue = sales.length > 0 ? sales[0].total : 0;
    res.json({ totalRevenue });
  } catch (err) {
    console.error('Error fetching total revenue:', err);
    res.status(500).json({ error: 'Failed to fetch total revenue' });
  }
});

// --- API to get Total Expenses for the current or selected month ---
app.get('/api/financial-report/total-expenses', async (req, res) => {
  try {
    let { month } = req.query;
    let start, end;
    if (month) {
      const [year, m] = month.split('-');
      start = new Date(Date.UTC(Number(year), Number(m) - 1, 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(Number(year), Number(m), 0, 23, 59, 59, 999));
    } else {
      const now = new Date();
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    }
    const expenses = await CashExpenditure.aggregate([
      {
        $match: {
          expenditure_date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);
    const totalExpenses = expenses.length > 0 ? expenses[0].total : 0;
    res.json({ totalExpenses });
  } catch (err) {
    console.error('Error fetching total expenses:', err);
    res.status(500).json({ error: 'Failed to fetch total expenses' });
  }
});

// --- API to get Net Profit for the current or selected month ---
app.get('/api/financial-report/net-profit', async (req, res) => {
  try {
    let { month } = req.query;
    let start, end;
    if (month) {
      const [year, m] = month.split('-');
      start = new Date(Date.UTC(Number(year), Number(m) - 1, 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(Number(year), Number(m), 0, 23, 59, 59, 999));
    } else {
      const now = new Date();
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    }
    // Find all completed sales for the month
    const sales = await Sale.find({
      date: { $gte: start, $lte: end },
      status: 'completed'
    });
    let netProfit = 0;
    for (const sale of sales) {
      // Get all sale items for this sale
      const saleItems = await SaleItem.find({ sale_id: sale._id }).populate('item_id');
      for (const item of saleItems) {
        // Profit per item: (unit_price - purchase_price_per_unit) * quantity_sold
        const purchasePrice = item.item_id && item.item_id.purchase_price_per_unit !== undefined
          ? item.item_id.purchase_price_per_unit
          : (item.item_id && item.item_id.purchase_price_per_package && item.item_id.units_per_package
            ? item.item_id.purchase_price_per_package / item.item_id.units_per_package
            : 0);
        const profit = (item.unit_price - purchasePrice) * item.quantity_sold;
        netProfit += profit;
      }
    }
    res.json({ netProfit });
  } catch (err) {
    console.error('Error fetching net profit:', err);
    res.status(500).json({ error: 'Failed to fetch net profit' });
  }
});

// --- API to get Monthly Profit Trend for the last 12 months ---
app.get('/api/financial-report/monthly-profit-trend', async (req, res) => {
  try {
    const now = new Date();
    const months = [];
    // Go from current month backward 12 times
    for (let i = 0; i < 12; i++) {
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth() - i;
      // Calculate correct year/month for negative months
      const d = new Date(Date.UTC(year, month, 1));
      const label = d.toISOString().slice(0, 7); // YYYY-MM
      const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));
      // Find all completed sales for the month
      const sales = await Sale.find({
        date: { $gte: start, $lte: end },
        status: 'completed'
      });
      let netProfit = 0;
      for (const sale of sales) {
        // Get all sale items for this sale
        const saleItems = await SaleItem.find({ sale_id: sale._id }).populate('item_id');
        for (const item of saleItems) {
          // Profit per item: (unit_price - purchase_price_per_unit) * quantity_sold
          const purchasePrice = item.item_id && item.item_id.purchase_price_per_unit !== undefined
            ? item.item_id.purchase_price_per_unit
            : (item.item_id && item.item_id.purchase_price_per_package && item.item_id.units_per_package
              ? item.item_id.purchase_price_per_package / item.item_id.units_per_package
              : 0);
          const profit = (item.unit_price - purchasePrice) * item.quantity_sold;
          netProfit += profit;
        }
      }
      months.push({ month: label, netProfit: Math.round(netProfit * 100) / 100 });
    }
    // Sort months from most recent to oldest
    months.sort((a, b) => b.month.localeCompare(a.month));
    res.json({ months });
  } catch (err) {
    console.error('Error fetching monthly profit trend:', err);
    res.status(500).json({ error: 'Failed to fetch monthly profit trend' });
  }
});

// --- API to get available payment statuses for sales ---
app.get('/api/sales/payment-statuses', (req, res) => {
  try {
    // Get enum values from the Sale schema
    const statuses = require('./models/Sale').schema.path('payment_status').enumValues;
    res.json({ statuses });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment statuses' });
  }
});

// --- API to get count of low stock items ---
app.get('/api/items/low-stock-count', async (req, res) => {
  try {
    const count = await require('./models/Item').countDocuments({ $expr: { $lte: ["$total_quantity", "$minimum_stock"] } });
    console.log('[DEBUG] Low stock items count:', count);
    res.json({ lowStockCount: count });
  } catch (err) {
    console.error('[DEBUG] Error fetching low stock count:', err);
    res.status(500).json({ error: 'Failed to fetch low stock count' });
  }
});

// --- API to get count of recently received items (unique items with 'addition' adjustment in last 7 days) ---
app.get('/api/items/recently-received-count', async (req, res) => {
  try {
    const InventoryAdjustment = require('./models/InventoryAdjustment');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentAdjustments = await InventoryAdjustment.aggregate([
      { $match: { adjustment_type: 'addition', adjustment_date: { $gte: sevenDaysAgo } } },
      { $group: { _id: '$item_id' } }
    ]);
    const count = recentAdjustments.length;
    console.log('[DEBUG] Recently received items count:', count);
    res.json({ recentlyReceivedCount: count });
  } catch (err) {
    console.error('[DEBUG] Error fetching recently received count:', err);
    res.status(500).json({ error: 'Failed to fetch recently received count' });
  }
});

// --- API to get stock table data for Stock Analysis modal ---
app.get('/api/items/stock-table', async (req, res) => {
  try {
    const Item = require('./models/Item');
    const InventoryAdjustment = require('./models/InventoryAdjustment');
    const items = await Item.find();
    const results = await Promise.all(items.map(async item => {
      // Find latest 'addition' adjustment for this item
      const lastAddition = await InventoryAdjustment.findOne({ item_id: item._id, adjustment_type: 'addition' })
        .sort({ adjustment_date: -1 });
      const lastReceived = lastAddition ? lastAddition.adjustment_date.toISOString().slice(0, 10) : null;
      const purchasePricePerUnit = item.item_type === 'weighable'
        ? (item.purchase_price_per_package / item.weight_per_package)
        : (item.purchase_price_per_package / item.units_per_package);
      return {
        name: item.name,
        currentStock: item.total_quantity,
        unitPrice: item.selling_price_per_unit,
        totalCost: item.total_quantity * purchasePricePerUnit,
        lastReceived,
        minimum_stock: item.minimum_stock
      };
    }));
    // Sort by totalCost descending
    results.sort((a, b) => b.totalCost - a.totalCost);
    res.json({ items: results });
  } catch (err) {
    console.error('[DEBUG] Error fetching stock table:', err);
    res.status(500).json({ error: 'Failed to fetch stock table' });
  }
});

// --- API to get Stock Movement Trend (last 5 months) ---
app.get('/api/stock/movement-trend', async (req, res) => {
  try {
    const InventoryAdjustment = require('./models/InventoryAdjustment');
    const Sale = require('./models/Sale');
    const SaleItem = require('./models/SaleItem');
    const now = new Date();
    const months = [];
    // Get last 5 months (current and previous 4)
    for (let i = 4; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const label = d.toISOString().slice(0, 7); // YYYY-MM
      const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));
      months.push({ label, start, end });
    }
    // Stock Inflow: sum of InventoryAdjustment.quantity for 'addition' per month
    const inflowAgg = await InventoryAdjustment.aggregate([
      { $match: { adjustment_type: 'addition', adjustment_date: { $gte: months[0].start, $lte: months[months.length-1].end } } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$adjustment_date" } },
        total: { $sum: "$quantity" }
      } }
    ]);
    const inflowMap = {};
    inflowAgg.forEach(r => { inflowMap[r._id] = r.total; });
    // Stock Outflow: sum of SaleItem.quantity_sold for sales in each month
    // First, get all sales in the 5 month range
    const saleDocs = await Sale.find({ date: { $gte: months[0].start, $lte: months[months.length-1].end }, status: 'completed' }, '_id date');
    const saleIdToMonth = {};
    saleDocs.forEach(sale => {
      const m = sale.date.toISOString().slice(0, 7);
      saleIdToMonth[sale._id.toString()] = m;
    });
    const saleIds = saleDocs.map(s => s._id);
    let outflowMap = {};
    if (saleIds.length > 0) {
      const saleItems = await SaleItem.find({ sale_id: { $in: saleIds } });
      saleItems.forEach(si => {
        const m = saleIdToMonth[si.sale_id.toString()];
        if (!outflowMap[m]) outflowMap[m] = 0;
        outflowMap[m] += si.quantity_sold;
      });
    }
    // Build arrays for chart
    const labels = months.map(m => m.label);
    const inflow = labels.map(l => inflowMap[l] || 0);
    const outflow = labels.map(l => outflowMap[l] || 0);
    res.json({ months: labels, inflow, outflow });
  } catch (err) {
    console.error('Error fetching stock movement trend:', err);
    res.status(500).json({ error: 'Failed to fetch stock movement trend' });
  }
});

// --- API to get Cash Utilization Ratio ---
app.get('/api/cash-utilization-ratio', async (req, res) => {
  try {
    const Item = require('./models/Item');
    const CashExpenditure = require('./models/CashExpenditure');
    const CreditTransaction = require('./models/CreditTransaction');
    const Sale = require('./models/Sale');
    // Month filter
    let { month } = req.query;
    let start, end;
    if (month) {
      const [year, m] = month.split('-');
      start = new Date(Date.UTC(Number(year), Number(m) - 1, 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(Number(year), Number(m), 0, 23, 59, 59, 999));
    }
    // Stock Investment: sum of totalCost for all items (as of now, or could be filtered by last updated in month)
    let stockInvestment = 0;
    if (month) {
      // If filtering by month, only include items updated in that month
      const items = await Item.find({ updatedAt: { $gte: start, $lte: end } });
      for (const item of items) {
        let purchasePricePerUnit = 0;
        if (item.item_type === 'weighable' && item.weight_per_package && item.purchase_price_per_package) {
          purchasePricePerUnit = item.purchase_price_per_package / item.weight_per_package;
        } else if (item.item_type === 'unit_based' && item.units_per_package && item.purchase_price_per_package) {
          purchasePricePerUnit = item.purchase_price_per_package / item.units_per_package;
        } else if (item.purchase_price_per_package) {
          purchasePricePerUnit = item.purchase_price_per_package;
        }
        stockInvestment += (item.total_quantity || 0) * purchasePricePerUnit;
      }
    } else {
      const items = await Item.find();
      for (const item of items) {
        let purchasePricePerUnit = 0;
        if (item.item_type === 'weighable' && item.weight_per_package && item.purchase_price_per_package) {
          purchasePricePerUnit = item.purchase_price_per_package / item.weight_per_package;
        } else if (item.item_type === 'unit_based' && item.units_per_package && item.purchase_price_per_package) {
          purchasePricePerUnit = item.purchase_price_per_package / item.units_per_package;
        } else if (item.purchase_price_per_package) {
          purchasePricePerUnit = item.purchase_price_per_package;
        }
        stockInvestment += (item.total_quantity || 0) * purchasePricePerUnit;
      }
    }
    // Operational Expenses: sum of all CashExpenditure amounts
    let operationalExpenses = 0;
    if (month) {
      const expensesAgg = await CashExpenditure.aggregate([
        { $match: { expenditure_date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      operationalExpenses = expensesAgg.length > 0 ? expensesAgg[0].total : 0;
    } else {
      const expensesAgg = await CashExpenditure.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      operationalExpenses = expensesAgg.length > 0 ? expensesAgg[0].total : 0;
    }
    // Pending Payments: sum of outstanding (unpaid) amounts in CreditTransaction (created in month)
    let pendingPayments = 0;
    if (month) {
      const pendingAgg = await CreditTransaction.aggregate([
        { $match: { payment_status: { $ne: 'paid' }, transaction_date: { $gte: start, $lte: end } } },
        { $project: { outstanding: { $subtract: ["$total_amount", { $ifNull: ["$amount_paid", 0] }] } } },
        { $group: { _id: null, total: { $sum: "$outstanding" } } }
      ]);
      pendingPayments = pendingAgg.length > 0 ? pendingAgg[0].total : 0;
    } else {
      const pendingAgg = await CreditTransaction.aggregate([
        { $match: { payment_status: { $ne: 'paid' } } },
        { $project: { outstanding: { $subtract: ["$total_amount", { $ifNull: ["$amount_paid", 0] }] } } },
        { $group: { _id: null, total: { $sum: "$outstanding" } } }
      ]);
      pendingPayments = pendingAgg.length > 0 ? pendingAgg[0].total : 0;
    }
    // Sales: sum of all completed sales (grand_total)
    let sales = 0;
    if (month) {
      const salesAgg = await Sale.aggregate([
        { $match: { status: 'completed', date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$grand_total" } } }
      ]);
      sales = salesAgg.length > 0 ? salesAgg[0].total : 0;
    } else {
      const salesAgg = await Sale.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: "$grand_total" } } }
      ]);
      sales = salesAgg.length > 0 ? salesAgg[0].total : 0;
    }
    // Compute percentages
    const total = stockInvestment + operationalExpenses + pendingPayments + sales;
    const percentages = total > 0 ? {
      stockInvestment: Math.round((stockInvestment / total) * 100),
      operationalExpenses: Math.round((operationalExpenses / total) * 100),
      pendingPayments: Math.round((pendingPayments / total) * 100),
      sales: Math.round((sales / total) * 100)
    } : { stockInvestment: 0, operationalExpenses: 0, pendingPayments: 0, sales: 0 };
    res.json({ stockInvestment, operationalExpenses, pendingPayments, sales, total, percentages });
  } catch (err) {
    console.error('Error fetching cash utilization ratio:', err);
    res.status(500).json({ error: 'Failed to fetch cash utilization ratio' });
  }
});

// --- API to get Top 5 Items by ROI ---
app.get('/api/items/top-roi', async (req, res) => {
  try {
    const Item = require('./models/Item');
    const SaleItem = require('./models/SaleItem');
    // Get all items
    const items = await Item.find();
    // For each item, compute total revenue, total cost, and ROI
    const roiList = [];
    for (const item of items) {
      // Get all sale items for this item
      const saleItems = await SaleItem.find({ item_id: item._id });
      if (!saleItems.length) continue;
      // Total quantity sold
      const totalQty = saleItems.reduce((sum, si) => sum + (si.quantity_sold || 0), 0);
      // Total revenue
      const totalRevenue = saleItems.reduce((sum, si) => sum + ((si.unit_price || 0) * (si.quantity_sold || 0)), 0);
      // Purchase price per unit
      let purchasePricePerUnit = 0;
      if (item.item_type === 'weighable' && item.weight_per_package && item.purchase_price_per_package) {
        purchasePricePerUnit = item.purchase_price_per_package / item.weight_per_package;
      } else if (item.item_type === 'unit_based' && item.units_per_package && item.purchase_price_per_package) {
        purchasePricePerUnit = item.purchase_price_per_package / item.units_per_package;
      } else if (item.purchase_price_per_package) {
        purchasePricePerUnit = item.purchase_price_per_package;
      }
      // Total cost
      const totalCost = purchasePricePerUnit * totalQty;
      // ROI
      let roi = 0;
      if (totalCost > 0) {
        roi = ((totalRevenue - totalCost) / totalCost) * 100;
      }
      roiList.push({ name: item.name, roi: Math.round(roi * 100) / 100 });
    }
    // Sort by ROI descending and return top 5
    roiList.sort((a, b) => b.roi - a.roi);
    res.json({ items: roiList.slice(0, 5) });
  } catch (err) {
    console.error('Error fetching top ROI items:', err);
    res.status(500).json({ error: 'Failed to fetch top ROI items' });
  }
});

// --- API to get Inventory Cost for a Month (with percent change) ---
app.get('/api/inventory/monthly-cost', async (req, res) => {
  try {
    const InventoryAdjustment = require('./models/InventoryAdjustment');
    const Item = require('./models/Item');
    let { month } = req.query;
    let start, end;
    if (month) {
      const [year, m] = month.split('-');
      start = new Date(Date.UTC(Number(year), Number(m) - 1, 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(Number(year), Number(m), 0, 23, 59, 59, 999));
    } else {
      const now = new Date();
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
      month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    }
    // Helper to compute total cost for a month
    async function getMonthCost(start, end) {
      const adjustments = await InventoryAdjustment.find({
        adjustment_type: 'addition',
        adjustment_date: { $gte: start, $lte: end }
      });
      const Item = require('./models/Item');
      let totalCost = 0;
      for (const adj of adjustments) {
        const item = await Item.findById(adj.item_id);
        if (!item) continue;
        let purchasePricePerUnit = 0;
        if (item.item_type === 'weighable' && item.weight_per_package && item.purchase_price_per_package) {
          purchasePricePerUnit = item.purchase_price_per_package / item.weight_per_package;
        } else if (item.item_type === 'unit_based' && item.units_per_package && item.purchase_price_per_package) {
          purchasePricePerUnit = item.purchase_price_per_package / item.units_per_package;
        } else if (item.purchase_price_per_package) {
          purchasePricePerUnit = item.purchase_price_per_package;
        }
        totalCost += (adj.quantity || 0) * purchasePricePerUnit;
      }
      const newItems = await Item.find({ createdAt: { $gte: start, $lte: end } });
      for (const item of newItems) {
        let purchasePricePerUnit = 0;
        if (item.item_type === 'weighable' && item.weight_per_package && item.purchase_price_per_package) {
          purchasePricePerUnit = item.purchase_price_per_package / item.weight_per_package;
        } else if (item.item_type === 'unit_based' && item.units_per_package && item.purchase_price_per_package) {
          purchasePricePerUnit = item.purchase_price_per_package / item.units_per_package;
        } else if (item.purchase_price_per_package) {
          purchasePricePerUnit = item.purchase_price_per_package;
        }
        totalCost += (item.total_quantity || 0) * purchasePricePerUnit;
      }
      return Math.round(totalCost * 100) / 100;
    }
    // Get current month cost
    const currCost = await getMonthCost(start, end);
    // Get previous month range
    let prevYear, prevMonthNum;
    if (month) {
      const [year, m] = month.split('-').map(Number);
      prevYear = year;
      prevMonthNum = m - 1;
      if (prevMonthNum === 0) { prevMonthNum = 12; prevYear--; }
    } else {
      const now = new Date();
      prevYear = now.getUTCFullYear();
      prevMonthNum = now.getUTCMonth();
      if (prevMonthNum === 0) { prevMonthNum = 12; prevYear--; }
    }
    const prevStart = new Date(Date.UTC(prevYear, prevMonthNum - 1, 1, 0, 0, 0, 0));
    const prevEnd = new Date(Date.UTC(prevYear, prevMonthNum, 0, 23, 59, 59, 999));
    const prevCost = await getMonthCost(prevStart, prevEnd);
    // Calculate percent change
    let percentChange = 0;
    if (prevCost > 0) {
      percentChange = ((currCost - prevCost) / prevCost) * 100;
    } else if (currCost > 0) {
      percentChange = 100;
    }
    percentChange = Math.round(percentChange * 10) / 10;
    res.json({ totalCost: currCost, percentChange });
  } catch (err) {
    console.error('Error fetching monthly inventory cost:', err);
    res.status(500).json({ error: 'Failed to fetch monthly inventory cost' });
  }
});

// --- API to get Inventory Cost Details for a Month ---
app.get('/api/inventory/monthly-cost-details', async (req, res) => {
  try {
    const InventoryAdjustment = require('./models/InventoryAdjustment');
    const Item = require('./models/Item');
    let { month } = req.query;
    let start, end;
    if (month) {
      const [year, m] = month.split('-');
      start = new Date(Date.UTC(Number(year), Number(m) - 1, 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(Number(year), Number(m), 0, 23, 59, 59, 999));
    } else {
      const now = new Date();
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    }
    // 1. Inventory Adjustments (additions) in the month
    const adjustments = await InventoryAdjustment.find({
      adjustment_type: 'addition',
      adjustment_date: { $gte: start, $lte: end }
    });
    const ItemMap = {};
    for (const adj of adjustments) {
      const item = await Item.findById(adj.item_id);
      if (!item) continue;
      let purchasePricePerUnit = 0;
      if (item.item_type === 'weighable' && item.weight_per_package && item.purchase_price_per_package) {
        purchasePricePerUnit = item.purchase_price_per_package / item.weight_per_package;
      } else if (item.item_type === 'unit_based' && item.units_per_package && item.purchase_price_per_package) {
        purchasePricePerUnit = item.purchase_price_per_package / item.units_per_package;
      } else if (item.purchase_price_per_package) {
        purchasePricePerUnit = item.purchase_price_per_package;
      }
      const cost = (adj.quantity || 0) * purchasePricePerUnit;
      if (!ItemMap[item._id]) {
        ItemMap[item._id] = { itemName: item.name, quantity: 0, cost: 0 };
      }
      ItemMap[item._id].quantity += (adj.quantity || 0);
      ItemMap[item._id].cost += cost;
    }
    // 2. New items created in the month (createdAt in month)
    const newItems = await Item.find({ createdAt: { $gte: start, $lte: end } });
    for (const item of newItems) {
      let purchasePricePerUnit = 0;
      if (item.item_type === 'weighable' && item.weight_per_package && item.purchase_price_per_package) {
        purchasePricePerUnit = item.purchase_price_per_package / item.weight_per_package;
      } else if (item.item_type === 'unit_based' && item.units_per_package && item.purchase_price_per_package) {
        purchasePricePerUnit = item.purchase_price_per_package / item.units_per_package;
      } else if (item.purchase_price_per_package) {
        purchasePricePerUnit = item.purchase_price_per_package;
      }
      const cost = (item.total_quantity || 0) * purchasePricePerUnit;
      if (!ItemMap[item._id]) {
        ItemMap[item._id] = { itemName: item.name, quantity: 0, cost: 0 };
      }
      ItemMap[item._id].quantity += (item.total_quantity || 0);
      ItemMap[item._id].cost += cost;
    }
    const details = Object.values(ItemMap).map(row => ({ ...row, cost: Math.round(row.cost * 100) / 100 }));
    res.json({ details });
  } catch (err) {
    console.error('Error fetching monthly inventory cost details:', err);
    res.status(500).json({ error: 'Failed to fetch monthly inventory cost details' });
  }
});

// --- API to get Expiring Products within X months ---
app.get('/api/items/expiring', async (req, res) => {
  try {
    const Item = require('./models/Item');
    let months = parseInt(req.query.months, 10);
    if (isNaN(months) || months < 1) months = 2;
    const now = new Date();
    const future = new Date(now);
    future.setMonth(future.getMonth() + months);
    // Find items with expiry_date between now and future
    const items = await Item.find({
      expiry_date: { $gte: now, $lte: future }
    });
    const result = items.map(item => ({
      expiry_date: item.expiry_date,
      name: item.name,
      total_quantity: item.total_quantity,
      total: (item.total_quantity || 0) * (item.selling_price_per_unit || 0)
    }));
    res.json({ items: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expiring products' });
  }
});

// --- API to get total number of users ---
app.get('/api/users/count', async (req, res) => {
  try {
    const User = require('./models/User');
    const count = await User.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user count' });
  }
});

// --- API to get count of users with status 'pending' ---
app.get('/api/users/pending-count', async (req, res) => {
  try {
    const User = require('./models/User');
    const count = await User.countDocuments({ status: 'pending' });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending user count' });
  }
});

// --- API to get count of users with status 'rejected' ---
app.get('/api/users/rejected-count', async (req, res) => {
  try {
    const User = require('./models/User');
    const count = await User.countDocuments({ status: 'rejected' });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rejected user count' });
  }
});

// --- API to get all active users ---
app.get('/api/users/active', async (req, res) => {
  try {
    const User = require('./models/User');
    const users = await User.find({ status: 'active' }, 'first_name last_name username email phone role status last_login _id');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch active users' });
  }
});

// --- API to get all pending users ---
app.get('/api/users/pending', async (req, res) => {
  try {
    const User = require('./models/User');
    const users = await User.find({ status: 'pending' }, 'first_name last_name username email phone role status createdAt _id');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending users' });
  }
});

// --- API to update user status by id ---
app.patch('/api/users/:id/status', async (req, res) => {
  try {
    const User = require('./models/User');
    const { status } = req.body;
    if (!['active', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Update POST /api/users to accept all fields for new user creation
app.post('/api/users', async (req, res) => {
  try {
    const User = require('./models/User');
    const { first_name, last_name, username, phone, email, password, role, status } = req.body;
    const user = new User({
      first_name,
      last_name,
      username,
      phone,
      email,
      password,
      role,
      status
    });
    await user.save();
    res.status(201).json({ message: 'User added successfully', user });
  } catch (err) {
    res.status(400).json({ error: 'Failed to add user', details: err });
  }
});

// --- API to delete a user by id ---
app.delete('/api/users/:id', async (req, res) => {
  try {
    const User = require('./models/User');
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// --- API to get all rejected users ---
app.get('/api/users/rejected', async (req, res) => {
  try {
    const User = require('./models/User');
    const users = await User.find({ status: 'rejected' }, 'first_name last_name username email phone role status createdAt _id');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rejected users' });
  }
});

// --- API to delete a sale by id and restore item quantities ---
app.delete('/api/sales/:id', async (req, res) => {
  try {
    const saleId = req.params.id;
    // Find all sale items for this sale
    const saleItems = await SaleItem.find({ sale_id: saleId });
    console.log('Deleting sale:', saleId, 'Sale items:', saleItems);
    // Restore item quantities
    await Promise.all(saleItems.map(async (si) => {
      const updateResult = await Item.findByIdAndUpdate(si.item_id, { $inc: { total_quantity: si.quantity_sold || si.quantity } });
      console.log('Restored item:', si.item_id, 'qty:', si.quantity_sold, 'Update result:', updateResult);
    }));
    // Delete sale items
    await SaleItem.deleteMany({ sale_id: saleId });
    // Delete the sale
    const deletedSale = await Sale.findByIdAndDelete(saleId);
    if (!deletedSale) return res.status(404).json({ error: 'Sale not found' });
    res.json({ message: 'Sale deleted and item quantities restored.' });
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ error: 'Failed to delete sale', details: error.message });
  }
});

// --- API to get all inventory adjustments with item details ---
app.get('/api/inventory-adjustments', async (req, res) => {
  try {
    const InventoryAdjustment = require('./models/InventoryAdjustment');
    const adjustments = await InventoryAdjustment.find()
      .populate('item_id')
      .sort({ adjustment_date: -1 });
    res.json({ adjustments });
  } catch (err) {
    console.error('Error fetching inventory adjustments:', err);
    res.status(500).json({ error: 'Failed to fetch inventory adjustments' });
  }
});

// --- API to delete an inventory adjustment and update item quantity ---
app.delete('/api/inventory-adjustments/:id', async (req, res) => {
  try {
    const InventoryAdjustment = require('./models/InventoryAdjustment');
    const Item = require('./models/Item');
    const adj = await InventoryAdjustment.findById(req.params.id);
    if (!adj) return res.status(404).json({ error: 'Adjustment not found' });
    const item = await Item.findById(adj.item_id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    // Only handle 'addition' and 'deduction' for now
    let update = 0;
    if (adj.adjustment_type === 'addition') {
      update = -Math.abs(adj.quantity);
    } else if (adj.adjustment_type === 'deduction') {
      update = Math.abs(adj.quantity);
    }
    // Update the item's total_quantity
    if (update !== 0) {
      item.total_quantity = Math.max(0, (item.total_quantity || 0) + update);
      await item.save();
    }
    await adj.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting inventory adjustment:', err);
    res.status(500).json({ error: 'Failed to delete inventory adjustment' });
  }
});

// --- API to get all lost items ---
app.get('/api/item-losses', async (req, res) => {
  try {
    const ItemLoss = require('./models/ItemLoss');
    const Item = require('./models/Item');
    
    // Get all lost items with populated item information
    const losses = await ItemLoss.find()
      .populate('item_id', 'name category_id')
      .populate('reported_by', 'first_name last_name')
      .sort({ loss_date: -1, createdAt: -1 });
    
    // Format the response to include item name
    const formattedLosses = losses.map(loss => ({
      _id: loss._id,
      item_id: loss.item_id._id,
      item_name: loss.item_id.name,
      loss_date: loss.loss_date,
      quantity_lost: loss.quantity_lost,
      unit_of_measure: loss.unit_of_measure,
      loss_reason: loss.loss_reason,
      loss_description: loss.loss_description,
      estimated_cost: loss.estimated_cost,
      reported_by: loss.reported_by ? `${loss.reported_by.first_name} ${loss.reported_by.last_name}` : 'System',
      location: loss.location,
      batch_number: loss.batch_number,
      supplier_batch: loss.supplier_batch,
      is_insured: loss.is_insured,
      insurance_claim_number: loss.insurance_claim_number,
      status: loss.status,
      investigation_notes: loss.investigation_notes,
      preventive_measures: loss.preventive_measures,
      photos: loss.photos,
      witnesses: loss.witnesses,
      total_loss_value: loss.total_loss_value,
      formatted_loss_date: loss.formatted_loss_date,
      createdAt: loss.createdAt,
      updatedAt: loss.updatedAt
    }));
    
    res.json({ losses: formattedLosses });
  } catch (err) {
    console.error('Error fetching lost items:', err);
    res.status(500).json({ error: 'Failed to fetch lost items' });
  }
});

// --- API to create a new lost item record ---
app.post('/api/item-losses', async (req, res) => {
  try {
    const {
      item_id,
      quantity_lost,
      loss_reason,
      loss_description,
      estimated_cost,
      reported_by,
      location,
      batch_number,
      unit_of_measure
    } = req.body;

    // Validation
    if (!item_id || !quantity_lost || !loss_reason || !loss_description || !estimated_cost) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Try to get user ID from JWT token if available
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (jwtError) {
        console.log('JWT token invalid or missing, proceeding without user ID');
      }
    }

    // If no user ID from token, try to use provided reported_by or make it optional
    if (!userId) {
      if (reported_by && reported_by !== 'current-user-id') {
        userId = reported_by;
      }
    }

    const newLoss = new ItemLoss({
      item_id,
      quantity_lost,
      loss_reason,
      loss_description,
      estimated_cost,
      reported_by: userId, // Use the extracted user ID or null
      location,
      batch_number,
      unit_of_measure
    });

    await newLoss.save();
    
    // Update item stock
    await newLoss.updateItemStock();
    
    res.status(201).json({ message: 'Lost item record created successfully', loss: newLoss });
  } catch (err) {
    console.error('Error creating lost item record:', err);
    res.status(500).json({ error: 'Failed to create lost item record', details: err.message });
  }
});

// --- API to delete a lost item record and restore stock ---
app.delete('/api/item-losses/:id', async (req, res) => {
  try {
    const ItemLoss = require('./models/ItemLoss');
    const Item = require('./models/Item');
    
    const lossId = req.params.id;
    
    // Find the loss record
    const lossRecord = await ItemLoss.findById(lossId);
    if (!lossRecord) {
      return res.status(404).json({ error: 'Loss record not found' });
    }
    
    // Get the item to restore stock
    const item = await Item.findById(lossRecord.item_id);
    if (!item) {
      return res.status(404).json({ error: 'Associated item not found' });
    }
    
    // Store the loss details for logging
    const lossDetails = {
      itemName: item.name,
      quantityLost: lossRecord.quantity_lost,
      unitOfMeasure: lossRecord.unit_of_measure,
      oldStock: item.total_quantity
    };
    
    // Restore the quantity to the item
    let quantityToRestore = lossRecord.quantity_lost;
    
    // Handle unit conversions if needed (reverse of the loss conversion)
    if (lossRecord.unit_of_measure !== item.base_unit) {
      // Basic conversion logic - reverse of what we did in updateItemStock
      if (lossRecord.unit_of_measure === 'kg' && item.base_unit === 'g') {
        quantityToRestore = lossRecord.quantity_lost * 1000;
      } else if (lossRecord.unit_of_measure === 'g' && item.base_unit === 'kg') {
        quantityToRestore = lossRecord.quantity_lost / 1000;
      } else if (lossRecord.unit_of_measure === 'l' && item.base_unit === 'ml') {
        quantityToRestore = lossRecord.quantity_lost * 1000;
      } else if (lossRecord.unit_of_measure === 'ml' && item.base_unit === 'l') {
        quantityToRestore = lossRecord.quantity_lost / 1000;
      } else if (lossRecord.unit_of_measure === 'box' && item.base_unit === 'pcs') {
        // Assume 1 box = units_per_package pieces for unit-based items
        if (item.item_type === 'unit_based' && item.units_per_package) {
          quantityToRestore = lossRecord.quantity_lost * item.units_per_package;
        }
      } else if (lossRecord.unit_of_measure === 'packet' && item.base_unit === 'pcs') {
        // Assume 1 packet = units_per_package pieces for unit-based items
        if (item.item_type === 'unit_based' && item.units_per_package) {
          quantityToRestore = lossRecord.quantity_lost * item.units_per_package;
        }
      } else if (lossRecord.unit_of_measure === 'sack' && item.base_unit === 'kg') {
        // Assume 1 sack = weight_per_package kg for weighable items
        if (item.item_type === 'weighable' && item.weight_per_package) {
          quantityToRestore = lossRecord.quantity_lost * item.weight_per_package;
        }
      } else {
        // For other conversions, assume 1:1 ratio
        console.log(`Warning: Converting ${lossRecord.unit_of_measure} to ${item.base_unit} using 1:1 ratio for restoration`);
      }
    }
    
    // Restore the quantity to the item
    item.total_quantity += quantityToRestore;
    await item.save();
    
    // Delete the loss record
    await ItemLoss.findByIdAndDelete(lossId);
    
    console.log(`Stock restored for item ${item.name}: ${lossDetails.oldStock} → ${item.total_quantity} ${item.base_unit}`);
    
    res.json({ 
      message: 'Loss record deleted successfully', 
      restoredQuantity: quantityToRestore,
      newStock: item.total_quantity,
      itemName: item.name
    });
  } catch (err) {
    console.error('Error deleting lost item record:', err);
    res.status(500).json({ error: 'Failed to delete lost item record', details: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Debug endpoint to check SaleItem data
app.get('/api/debug/sale-items', async (req, res) => {
  try {
    console.log('Debug SaleItem endpoint called');
    
    // Check total count
    const totalSaleItems = await SaleItem.countDocuments();
    console.log('Total SaleItem documents:', totalSaleItems);
    
    if (totalSaleItems === 0) {
      return res.json({
        message: 'No SaleItem documents found',
        total: 0,
        sample: null
      });
    }
    
    // Get a sample document
    const sampleSaleItem = await SaleItem.findOne().populate('item_id', 'name');
    console.log('Sample SaleItem:', sampleSaleItem);
    
    // Check if there are any completed sales
    const Sale = require('./models/Sale');
    const completedSales = await Sale.countDocuments({ status: 'completed' });
    console.log('Completed sales count:', completedSales);
    
    // Get sample sale items with item info
    const sampleItems = await SaleItem.aggregate([
      { $limit: 5 },
      {
        $lookup: {
          from: 'items',
          localField: 'item_id',
          foreignField: '_id',
          as: 'item_info'
        }
      },
      { $unwind: '$item_info' },
      {
        $project: {
          _id: 1,
          sale_id: 1,
          item_name: '$item_info.name',
          quantity_sold: 1,
          total_price: 1
        }
      }
    ]);
    
    res.json({
      message: 'SaleItem data found',
      total: totalSaleItems,
      completedSales: completedSales,
      sample: sampleSaleItem,
      sampleItems: sampleItems
    });
    
  } catch (err) {
    console.error('Debug SaleItem endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Simple test endpoint for SaleItem data
app.get('/api/test/sale-items', async (req, res) => {
  try {
    console.log('Test SaleItem endpoint called');
    
    // Get all SaleItem documents with basic info
    const saleItems = await SaleItem.find()
      .populate('item_id', 'name')
      .populate('sale_id', 'date status')
      .limit(10);
    
    console.log('Found sale items:', saleItems.length);
    
    res.json({
      count: saleItems.length,
      items: saleItems.map(item => ({
        id: item._id,
        sale_id: item.sale_id,
        item_name: item.item_id ? item.item_id.name : 'Unknown',
        quantity_sold: item.quantity_sold,
        total_price: item.total_price,
        sale_date: item.sale_id ? item.sale_id.date : null,
        sale_status: item.sale_id ? item.sale_id.status : null
      }))
    });
    
  } catch (err) {
    console.error('Test SaleItem endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});
