const mongoose = require('mongoose');

// Appointment Schema
const appointmentSchema = new mongoose.Schema({
    date: {
        type: Date,
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
    clientUsername: {
        type: String,
        required: true,
    },
    specialistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Specialist', // nombre del modelo al que se hace referencia
    },
    specialistUsername: {
        type: String,
        required: true, 
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
    serviceType: {
        type: String,
        enum: ['Domicilio', 'Presencial', 'Mixto'],
    },
});

// Model name: Appointment
const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = { Appointment, appointmentSchema };