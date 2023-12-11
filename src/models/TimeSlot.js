import mongoose from 'mongoose';

const timeSlotSchema = new mongoose.Schema({
  start: {
    type: String,
    required: true,
  },
  end: {
    type: String,
    required: true,
  },
}, {_id: false});

const TimeSlot = mongoose.model('TimeSlot', timeSlotSchema);

export { TimeSlot, timeSlotSchema };