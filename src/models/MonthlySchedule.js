import mongoose from 'mongoose';
import { daySchema } from './Day.js';

const monthlyScheduleSchema = new mongoose.Schema({
    month: {
        type: String,
        required: true,
    },
    days: [daySchema],
}, {_id: false});

const MonthlySchedule = mongoose.model('MonthlySchedule', monthlyScheduleSchema);

export { MonthlySchedule, monthlyScheduleSchema };