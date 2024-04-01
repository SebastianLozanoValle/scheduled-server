const mongoose = require('mongoose');
const { userSchema } = require('./User.js');
const { appointmentSchema } = require('./Appointment.js');
const { reviewSchema } = require('./Review.js');
const { timeSlotSchema } = require('./TimeSlot.js');

const specialistSchema = new mongoose.Schema({
  ...userSchema.obj, // inherit user schema
  specialtys: [
    {
      name:{
        type: String,
        required: true,
      },
      description:{
        type: String,
        required: true,
      },
      icon:{
        type: String,
        required: false,
      },
      price:{
        type: Number,
        required: true,
        validate(value) {
          if (value <= 0) {
            throw new Error('Price must be a positive number');
          }
        }
      },
      time:{
        type: String,
        required: true,
        validate: {
          validator: function(value) {
            // Convertir el tiempo a minutos
            const timeParts = value.split(':');
            const minutes = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);

            // Comprobar si los minutos son un múltiplo de 30 y están entre 30 y 90
            return minutes % 30 === 0 && minutes >= 30 && minutes <= 180;
          },
          message: 'El tiempo debe ser un múltiplo de 30 minutos entre 30 minutos y 1 hora y 30 minutos'
        }
      },
      state: {
        type: Boolean,
        default: false,
      },
    }
  ],
  world: {
    type: [String],
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
    enum: ['Domicilio', 'Local', 'Mixto'],
  },
  accountNumber: {
    type: String,
    required: true,
  },
  reject: {
    type: Boolean,
    default: false,
  },
});

const Specialist = mongoose.model('Specialist', specialistSchema);

module.exports = { Specialist, specialistSchema };