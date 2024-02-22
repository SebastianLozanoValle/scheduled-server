const mongoose = require('mongoose');
const { specialistSchema } = require("./Specialist.js");
const { clientSchema } = require("./Client.js");

const invoiceSchema = new mongoose.Schema({
    merchant: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    country: {
        type: Number,
        required: true,
    },
    order: {
        type: String,
        required: true,
        unique: true,
    },
    money: {
        type: String,
        required: true,
    },
    amount: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    language: {
        type: String,
        required: true,
    },
    expiration: {
        type: String,
        required: true,
    },
    iva: {
        type: String,
        required: true,
    },
    user_name: {
        type: String,
        required: true,
    },
    clientId: clientSchema,
    specialistId: specialistSchema,
    date: {
        type: Date,
        required: true,
        default: Date.now, // Se establecerá al momento actual por defecto
    },
    status: {
        type: String,
    },
    checksum: {
        type: String,
        required: true,
    },
    link: {
        type: String,
    },
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = { Invoice, invoiceSchema };