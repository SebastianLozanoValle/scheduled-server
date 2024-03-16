const mongoose = require('mongoose');
const { FileSchema } = require('./File');
const { NotificationSchema } = require('./Notifications');

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
    type: String,
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
  files: [FileSchema],
  notifications: [NotificationSchema]
});

const User = mongoose.model('User', userSchema);

module.exports = { User, userSchema };