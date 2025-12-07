const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Question = require('./models/Question');
const Subject = require('./models/Subject');
const Topic = require('./models/Topic');
const Notification = require('./models/Notification');
const Syllabus = require('./models/Syllabus');

// Initial data based on constants.ts
const SUBJECTS = [
    // Category 1
    { name: 'Child Development', color: '#f59e0b', tetCategory: '1' },
    { name: 'Tamil', color: '#ef4444', tetCategory: '1' },
    { name: 'English', color: '#3b82f6', tetCategory: '1' },
    { name: 'Mathematics', color: '#10b981', tetCategory: '1' },
    { name: 'Environmental Science', color: '#14b8a6', tetCategory: '1' },

    // Category 2
    { name: 'Science', color: '#8b5cf6', tetCategory: '2' },
    { name: 'Social Science', color: '#ec4899', tetCategory: '2' },

    // Category 3 Specific
    { name: 'Tamil Part I', color: '#e11d48', tetCategory: '3' },
    { name: 'Tamil Part II', color: '#be123c', tetCategory: '3' },
    { name: 'English', color: '#2563eb', tetCategory: '3' },
    { name: 'Physical Science', color: '#7c3aed', tetCategory: '3' },
    { name: 'Mathematics', color: '#059669', tetCategory: '3' },
    { name: 'Natural Science', color: '#65a30d', tetCategory: '3' },
    { name: 'Social Science', color: '#db2777', tetCategory: '3' },
];

const seedDatabase = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in .env file');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        console.log('Clearing existing data...');
        await User.deleteMany({});
        await Question.deleteMany({});
        await Subject.deleteMany({});
        await Topic.deleteMany({});
        await Notification.deleteMany({});
        await Syllabus.deleteMany({});
        console.log('Existing data cleared');

        // Create subjects
        console.log('Creating subjects...');
        const subjects = await Subject.insertMany(SUBJECTS);
        console.log(`Created ${subjects.length} subjects`);

        // Create subject ID map for easy reference
        const subjectMap = {};
        subjects.forEach(s => {
            subjectMap[s.name] = s._id.toString();
        });

        // Create topics
        console.log('Creating topics...');
        const topics = await Topic.insertMany([
            { subjectId: subjectMap['Child Development'], name: 'Growth & Development', questionCount: 50 },
            { subjectId: subjectMap['Tamil'], name: 'Grammar', questionCount: 100 },
            { subjectId: subjectMap['English'], name: 'Poetry', questionCount: 80 },
            { subjectId: subjectMap['Mathematics'], name: 'Number System', questionCount: 120 },
            { subjectId: subjects.find(s => s.name === 'Tamil Part I' && s.tetCategory === '3')?._id.toString(), name: 'Sangam Literature', questionCount: 40 },
            { subjectId: subjects.find(s => s.name === 'Mathematics' && s.tetCategory === '3')?._id.toString(), name: 'Algebra', questionCount: 60 },
        ]);
        console.log(`Created ${topics.length} topics`);

        // Create topic ID map
        const topicMap = {};
        topics.forEach(t => {
            topicMap[t.name] = t._id.toString();
        });

        // Create users
        console.log('Creating users...');
        const hashedUserPassword = await bcrypt.hash('user', 10);
        const hashedAdminPassword = await bcrypt.hash('admin', 10);

        const users = await User.insertMany([
            {
                name: 'Student User',
                username: 'user',
                password: hashedUserPassword,
                email: 'student@examforge.com',
                mobile: '9876543210',
                district: 'Chennai',
                subDistrict: 'Adyar',
                role: 'user',
                status: 'active',
                tetCategory: '1',
                avatarUrl: 'https://ui-avatars.com/api/?name=Student+User&background=random',
                selectedSubjects: [
                    subjectMap['Child Development'],
                    subjectMap['Tamil'],
                    subjects.find(s => s.name === 'English' && s.tetCategory === '1')?._id.toString(),
                    subjects.find(s => s.name === 'Mathematics' && s.tetCategory === '1')?._id.toString(),
                    subjectMap['Environmental Science']
                ],
                mainSubject: 'Mathematics'
            },
            {
                name: 'Admin Administrator',
                username: 'admin',
                password: hashedAdminPassword,
                email: 'admin@examforge.com',
                role: 'admin',
                status: 'active',
                tetCategory: '1',
                avatarUrl: 'https://ui-avatars.com/api/?name=Admin+Administrator&background=random'
            }
        ]);
        console.log(`Created ${users.length} users`);

        // Create questions
        console.log('Creating questions...');
        const questions = await Question.insertMany([
            {
                subjectId: subjects.find(s => s.name === 'Mathematics' && s.tetCategory === '1')?._id.toString(),
                topicId: topicMap['Number System'],
                text: 'What is the place value of 5 in 1524?',
                difficulty: 'easy',
                tags: ['basic'],
                mistakeCount: 1,
                tetCategory: '1',
                status: 'active',
                explanation: 'The digit 5 is in the hundreds place. So 5 * 100 = 500.',
                options: [
                    { text: '5', isCorrect: false },
                    { text: '50', isCorrect: false },
                    { text: '500', isCorrect: true },
                    { text: '5000', isCorrect: false },
                ]
            },
            {
                subjectId: subjectMap['Child Development'],
                topicId: topicMap['Growth & Development'],
                text: 'Who is known as the father of Child Psychology?',
                difficulty: 'medium',
                tags: ['psychology', 'theory'],
                mistakeCount: 5,
                tetCategory: 'all',
                status: 'active',
                explanation: 'Jean Piaget is often referred to as the father of child psychology.',
                options: [
                    { text: 'Jean Piaget', isCorrect: true },
                    { text: 'Vygotsky', isCorrect: false },
                    { text: 'Skinner', isCorrect: false },
                    { text: 'Freud', isCorrect: false },
                ]
            },
            {
                subjectId: subjectMap['Science'],
                topicId: topics[0]._id.toString(), // Using first topic as placeholder
                text: 'What is the chemical formula for water?',
                difficulty: 'easy',
                tags: ['chemistry'],
                mistakeCount: 0,
                tetCategory: '2',
                status: 'active',
                explanation: 'H2O stands for 2 Hydrogen atoms and 1 Oxygen atom.',
                options: [
                    { text: 'H2O', isCorrect: true },
                    { text: 'CO2', isCorrect: false },
                    { text: 'NaCl', isCorrect: false },
                    { text: 'O2', isCorrect: false },
                ]
            },
            {
                subjectId: subjects.find(s => s.name === 'Tamil Part I' && s.tetCategory === '3')?._id.toString(),
                topicId: topicMap['Sangam Literature'],
                text: 'திருக்குறளை எழுதியவர் யார்?',
                difficulty: 'easy',
                tags: ['literature'],
                mistakeCount: 0,
                tetCategory: '3',
                status: 'active',
                explanation: 'திருவள்ளுவர்.',
                options: [
                    { text: 'கம்பர்', isCorrect: false },
                    { text: 'திருவள்ளுவர்', isCorrect: true },
                    { text: 'பாரதியார்', isCorrect: false },
                    { text: 'ஔவையார்', isCorrect: false },
                ]
            }
        ]);
        console.log(`Created ${questions.length} questions`);

        // Create notifications
        console.log('Creating notifications...');
        const notifications = await Notification.insertMany([
            {
                type: 'ticker',
                content: 'Exam dates announced! <b>Check the official website</b> for details.',
                active: true,
                color: '#ef4444',
                fontSize: 'text-base'
            },
            {
                type: 'popup',
                content: 'Welcome to the new KTET preparation app. <br/>Start a <b>quiz</b> today!',
                active: true,
                alignment: 'center',
                fontSize: 'text-lg',
                imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=300&h=200'
            }
        ]);
        console.log(`Created ${notifications.length} notifications`);

        // Create syllabus
        console.log('Creating syllabus...');
        const syllabus = await Syllabus.insertMany([
            {
                tetCategory: '1',
                subjectId: subjectMap['Child Development'],
                unitTitle: 'Unit I: Physical Growth',
                description: 'Growth and maturation, genetic factors',
                order: 1
            },
            {
                tetCategory: '1',
                subjectId: subjectMap['Tamil'],
                unitTitle: 'Unit I: இலக்கணம்',
                description: 'எழுத்து, சொல், பொருள், யாப்பு, அணி',
                order: 1
            },
            {
                tetCategory: '3',
                subjectId: subjects.find(s => s.name === 'Mathematics' && s.tetCategory === '3')?._id.toString(),
                unitTitle: 'Unit I: Number Systems',
                description: 'Real numbers, Complex numbers',
                order: 1
            },
        ]);
        console.log(`Created ${syllabus.length} syllabus items`);

        console.log('\n✅ Database seeded successfully!');
        console.log('\nDefault credentials:');
        console.log('User: username=user, password=user');
        console.log('Admin: username=admin, password=admin');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
