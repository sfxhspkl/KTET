const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    color: { type: String, required: true },
    tetCategory: { type: String, enum: ['1', '2', '3'], required: true },
    icon: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Subject', subjectSchema);
