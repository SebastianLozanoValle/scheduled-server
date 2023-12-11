import mongoose from 'mongoose';
import { userSchema } from './User.js';
import { appointmentSchema } from './Appointment.js';
import { reviewSchema } from './Review.js';

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

export { Client, clientSchema };