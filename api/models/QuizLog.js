const mongoose = require('mongoose');

const quizLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    subjectName: { type: String, required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    correctCount: { type: Number, required: true },
    incorrectCount: { type: Number, required: true, default: 0 },
    skippedCount: { type: Number, required: true, default: 0 },
    accuracy: { type: Number, required: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('QuizLog', quizLogSchema);
