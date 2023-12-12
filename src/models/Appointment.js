import mongoose from 'mongoose';

// Appointment Schema
const appointmentSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true,
    },
    startTime: {
        type: String,
        required: true,
    },
    estimatedEndTime: {
        type: String,
        required: true,
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client', // nombre del modelo al que se hace referencia
    },
    specialistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Specialist', // nombre del modelo al que se hace referencia
    },
    subject: {
        type: String,
        required: true,
    },
    detail: String,
    value: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['waiting', 'scheduled', 'pending', 'completed'],
        default: 'waiting',
    },
});

// Model name: Appointment
const Appointment = mongoose.model('Appointment', appointmentSchema);

export { Appointment, appointmentSchema };