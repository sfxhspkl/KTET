const mongoose = require('mongoose');

const syllabusSchema = new mongoose.Schema({
    tetCategory: { type: String, enum: ['1', '2', '3'], required: true },
    subjectId: { type: String, required: true },
    unitTitle: { type: String, required: true },
    description: { type: String, required: true },
    order: { type: Number, required: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Syllabus', syllabusSchema);
