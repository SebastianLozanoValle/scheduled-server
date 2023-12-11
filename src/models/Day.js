// Day.js
import mongoose from 'mongoose';
import { timeSlotSchema } from './TimeSlot.js';
import { appointmentSchema } from './Appointment.js';

const daySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  availableTimeSlots: [timeSlotSchema],
  appointments: [appointmentSchema],
}, {_id: false});

daySchema.virtual('weekday').get(function() {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return weekdays[this.date.getUTCDay()];
});

const Day = mongoose.model('Day', daySchema);

export { Day, daySchema };