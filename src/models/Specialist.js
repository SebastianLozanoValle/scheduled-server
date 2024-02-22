const mongoose = require('mongoose');
const { userSchema } = require('./User.js');
const { appointmentSchema } = require('./Appointment.js');
const { reviewSchema } = require('./Review.js');
const { timeSlotSchema } = require('./TimeSlot.js');

const specialistSchema = new mongoose.Schema({
  ...userSchema.obj, // inherit user schema
  specialtys:  {
    type: [String],
    enum: ['Peluqueria', 'Manicura', 'Pedicura'],
  },
  world:  {
    type: String,
    enum: ['Hombre', 'Mujer', 'Mascota'],
  },
  appointments: [appointmentSchema], // new appointments property
  weeklySchedule: {
    Monday: [timeSlotSchema],
    Tuesday: [timeSlotSchema],
    Wednesday: [timeSlotSchema],
    Thursday: [timeSlotSchema],
    Friday: [timeSlotSchema],
    Saturday: [timeSlotSchema],
    Sunday: [timeSlotSchema]
  },
  reviews: [reviewSchema],
  paymentOption: {
    type: String,
    enum: ['weekly', 'biweekly', 'monthly'],
  },
  completedAppointments: [appointmentSchema],
  highlighted: {
    type: Boolean,
    default: false,
  },
  serviceType: {
    type: String,
    enum: ['Domicilio', 'Presencial', 'Mixto'],
  },
});

const Specialist = mongoose.model('Specialist', specialistSchema);

module.exports = { Specialist, specialistSchema };