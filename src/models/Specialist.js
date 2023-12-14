import mongoose from 'mongoose';
import { userSchema } from './User.js';
import { monthlyScheduleSchema } from './MonthlySchedule.js';
import { appointmentSchema } from './Appointment.js';
import { reviewSchema } from './Review.js';
import { timeSlotSchema } from './TimeSlot.js';

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
  monthlySchedule: [monthlyScheduleSchema],
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
});

const Specialist = mongoose.model('Specialist', specialistSchema);

export { Specialist, specialistSchema };