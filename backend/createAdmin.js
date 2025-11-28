const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const CashExpenditure = require('./models/CashExpenditure');
const CommodityRequest = require('./models/CommodityRequest');
const Customer = require('./models/Customer');

dotenv.config({ path: __dirname + '/.env' });

/* ------------------------------ CREATE USERS ------------------------------ */
async function createUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // === Default Admin User ===
    const adminEmail = 'admin@example.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const hashedAdminPass = await bcrypt.hash('admin1234', 12);
      const admin = new User({
        username: 'adminuser',
        email: adminEmail,
        password: hashedAdminPass,
        first_name: 'Liven',
        last_name: 'Allan',
        phone: '0700000000',
        role: 'SalesManager'
      });
      await admin.save();
      console.log('🟢 Admin user created successfully');
    } else {
      console.log('⚠️ Admin user already exists');
    }

    // === Personal User ===
    const personalEmail = 'lutaloallan6@gmail.com';
    const existingPersonal = await User.findOne({ email: personalEmail });

    if (!existingPersonal) {
      const hashedPersonalPass = await bcrypt.hash('Allan2000#', 12);
      const personalUser = new User({
        username: 'Liven',
        email: personalEmail,
        password: hashedPersonalPass,
        first_name: 'Liven',
        last_name: 'Allan',
        phone: '0700000000',
        role: 'SalesManager'
      });
      await personalUser.save();
      console.log('🟢 Personal user (Liven Allan) created successfully');
    } else {
      console.log('⚠️ Personal user already exists');
    }

  } catch (err) {
    console.error('❌ Error creating users:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB connection closed');
  }
}

/* -------------------------- OPTIONAL: OTHER SEEDERS -------------------------- */

const purposes = [
  'Food', 'Transport', 'Fuel', 'Sacco', 'Abatapowa',
  'Office Supplies', 'Internet', 'Maintenance', 'Utilities', 'Other'
];

async function seedCommodityRequests() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for CommodityRequest seeding');

    await CommodityRequest.deleteMany({});
    const customers = await Customer.find({}, '_id phone');
    const customerIds = customers.map(c => ({ id: c._id, phone: c.phone }));
    const fallbackCustomer = { id: '6866eb5f4889c3808385717c', phone: '0788989006' };

    const now = new Date();
    const productTypes = ['other', 'unit_based', 'weight_based'];
    const priorities = ['low', 'medium', 'high'];
    const statuses = ['pending', 'approved', 'rejected', 'fulfilled', 'partially_fulfilled'];
    const commodityNames = ['Basmatti', 'White star', 'Pilao', 'Gnuts', 'Kick Snacks', 'Maize', 'Beans', 'Sugar', 'Salt', 'Rice'];
    const requests = [];

    for (let m = 0; m < 5; m++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 5);
      for (let i = 0; i < 5; i++) {
        const day = 2 + i * 5;
        const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
        if (date > now) continue;
        const customer = customerIds.length > 0 ? customerIds[Math.floor(Math.random() * customerIds.length)] : fallbackCustomer;

        requests.push({
          commodity_name: commodityNames[Math.floor(Math.random() * commodityNames.length)],
          requested_date: date,
          quantity_desired: Math.floor(Math.random() * 100) + 10,
          product_type: productTypes[Math.floor(Math.random() * productTypes.length)],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          customer_id: customer.id,
          customer_contact: customer.phone,
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          fulfilled_quantity: 0,
        });
      }
    }

    for (const req of requests) {
      await new CommodityRequest(req).save();
    }

    console.log('🟢 Seeded CommodityRequest records for the past 5 months.');
  } catch (err) {
    console.error('❌ Error seeding commodity requests:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB connection closed');
  }
}

/* ------------------------------ MAIN EXECUTION ------------------------------ */
if (require.main === module) {
  (async () => {
    await createUsers();
    await seedCommodityRequests();
    process.exit(0);
  })();
}
