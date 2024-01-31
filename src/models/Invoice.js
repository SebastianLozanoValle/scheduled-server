import mongoose from "mongoose";

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
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // nombre del modelo al que se hace referencia
    },
    specialistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Specialist", // nombre del modelo al que se hace referencia
    },
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
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

export { Invoice, invoiceSchema };