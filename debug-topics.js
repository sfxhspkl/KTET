import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const SubjectSchema = new mongoose.Schema({
    name: String,
    color: String,
    tetCategory: String
});
const Subject = mongoose.model('Subject', SubjectSchema);

const TopicSchema = new mongoose.Schema({
    name: String,
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    questionCount: Number
});
const Topic = mongoose.models.Topic || mongoose.model('Topic', TopicSchema);

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const subjects = await Subject.find({});
        console.log('\n--- SUBJECTS ---');
        subjects.forEach(s => console.log(`ID: ${s._id} | Name: ${s.name}`));

        const topics = await Topic.find({});
        console.log('\n--- TOPICS ---');
        topics.forEach(t => {
            const relatedSubject = subjects.find(s => s._id.toString() === t.subjectId?.toString());
            const status = relatedSubject ? `MATCH: ${relatedSubject.name}` : 'NO MATCH (Unknown Subject)';
            console.log(`Topic: ${t.name} | SubjectID: ${t.subjectId} | ${status}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkData();
