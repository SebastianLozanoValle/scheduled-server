const mongoose = require('mongoose');
const { userSchema } = require('./User.js');
const { appointmentSchema } = require('./Appointment.js');
const { reviewSchema } = require('./Review.js');

const clientSchema = new mongoose.Schema({
  ...userSchema.obj, // inherit user schema
  appointments: [appointmentSchema],
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialist', // nombre del modelo al que se hace referencia
  }],
  reviews: [reviewSchema],
});

const Client = mongoose.model('Client', clientSchema);

module.exports = { Client, clientSchema };