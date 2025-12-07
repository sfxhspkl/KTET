const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: String, enum: ['user', 'admin'], required: true },
    userName: { type: String, required: true },
    content: { type: String, required: true },
    date: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
}, {
    timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);
