const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatar: String,
  age: {
    type: Number,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  street: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'specialist', 'client'],
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

const User = mongoose.model('User', userSchema);

module.exports = { User, userSchema };