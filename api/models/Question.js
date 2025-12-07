const mongoose = require('mongoose');

const questionOptionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true }
}, { _id: true });

const questionSchema = new mongoose.Schema({
    subjectId: { type: String, required: true },
    topicId: { type: String, required: true },
    text: { type: String, required: true },
    options: [questionOptionSchema],
    explanation: { type: String, required: false },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    tags: [String],
    mistakeCount: { type: Number, default: 0 },
    tetCategory: { type: String, enum: ['1', '2', '3', 'all'], required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Question', questionSchema);
