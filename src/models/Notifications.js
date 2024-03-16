const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    tipo: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    reviewed: {
        type: Boolean,
        default: false
    }
});

const Notification = mongoose.model("Notification", NotificationSchema);

module.exports = { Notification, NotificationSchema };