const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    trim: true
  },
  first_name: {
    type: String,
    trim: true
  },
  last_name: {
    type: String,
    trim: true
  },
  phone: {
    type: String
  },
  role: {
    type: String,
    enum: ['SalesManager', 'SalesPerson'],
    default: 'SalesPerson'
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'rejected'],
    default: 'pending'
  },
  is_active: {
    type: Boolean,
    default: true
  },
  last_login: {
    type: Date
  }
}, { timestamps: true }); // adds createdAt and updatedAt

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
