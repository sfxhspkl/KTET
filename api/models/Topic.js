const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
    subjectId: { type: String, required: true },
    name: { type: String, required: true },
    questionCount: { type: Number, default: 0 }
}, {
    timestamps: true
});

module.exports = mongoose.model('Topic', topicSchema);
