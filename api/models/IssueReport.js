const mongoose = require('mongoose');

const issueReportSchema = new mongoose.Schema({
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'resolved'], default: 'pending' }
}, {
    timestamps: true
});

module.exports = mongoose.model('IssueReport', issueReportSchema);
