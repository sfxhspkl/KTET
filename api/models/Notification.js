const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    type: { type: String, enum: ['popup', 'ticker'], required: true },
    content: { type: String, required: true },
    active: { type: Boolean, default: true },
    color: String,
    fontSize: { type: String, enum: ['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'] },
    imageUrl: String,
    alignment: { type: String, enum: ['left', 'center', 'right'] }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
