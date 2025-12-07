const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');
const Question = require('./models/Question');
const Subject = require('./models/Subject');
const Topic = require('./models/Topic');
const QuizLog = require('./models/QuizLog');
const IssueReport = require('./models/IssueReport');
const Message = require('./models/Message');
const Notification = require('./models/Notification');
const Syllabus = require('./models/Syllabus');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// MongoDB Connection
const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

connectDB();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'ktet-quiz-secret-key-change-in-production';

// Auth Middleware
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Admin Middleware
const adminMiddleware = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Content Manager Middleware (Admin OR User with canManageContent)
const contentManagerMiddleware = async (req, res, next) => {
    try {
        if (req.userRole === 'admin') {
            return next();
        }

        const user = await User.findById(req.userId);
        if (user && user.canManageContent) {
            return next();
        }

        return res.status(403).json({ error: 'Content management access required' });
    } catch (error) {
        console.error('Content manager auth error:', error);
        res.status(500).json({ error: 'Server error authorizing request' });
    }
};

// ==================== AUTH ROUTES ====================

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.status === 'blocked') {
            return res.status(403).json({ error: 'Account is blocked. Contact Admin.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const userObj = user.toObject();
        delete userObj.password;

        res.json({ token, user: userObj });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Signup
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, password, name, ...otherData } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            password: hashedPassword,
            name,
            ...otherData,
            role: 'user',
            status: 'active'
        });

        await user.save();

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const userObj = user.toObject();
        delete userObj.password;

        res.status(201).json({ token, user: userObj });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get current user
app.get('/api/auth/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== USER ROUTES ====================

// Get all users (admin only)
app.get('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user by ID
app.get('/api/users/:id', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user
app.put('/api/users/:id', authMiddleware, async (req, res) => {
    try {
        // Users can only update their own profile, admins can update anyone
        if (req.userRole !== 'admin' && req.userId !== req.params.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updateData = { ...req.body };
        delete updateData.password; // Don't allow password updates through this endpoint

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create user (admin only)
app.post('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { username, password, name, ...otherData } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password || '123456', 10);

        const user = new User({
            username,
            password: hashedPassword,
            name,
            ...otherData,
            status: 'active'
        });

        await user.save();
        const userObj = user.toObject();
        delete userObj.password;

        res.status(201).json(userObj);
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user (admin only)
app.delete('/api/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        // Prevent deleting yourself
        if (req.userId === req.params.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update usage time
app.put('/api/users/:id/usage', authMiddleware, async (req, res) => {
    try {
        const { totalUsageTime } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { totalUsageTime },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Update usage error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== QUESTION ROUTES ====================

// Get all questions (with filters)
app.get('/api/questions', authMiddleware, async (req, res) => {
    try {
        const { tetCategory, subjectId, topicId, status } = req.query;

        let filter = {};

        if (tetCategory) {
            filter.$or = [
                { tetCategory: tetCategory },
                { tetCategory: 'all' }
            ];
        }

        if (subjectId) filter.subjectId = subjectId;
        if (topicId) filter.topicId = topicId;
        if (status) filter.status = status;

        const questions = await Question.find(filter);
        res.json(questions);
    } catch (error) {
        console.error('Get questions error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get question by ID
app.get('/api/questions/:id', authMiddleware, async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        res.json(question);
    } catch (error) {
        console.error('Get question error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create question (Admin or Content Manager)
app.post('/api/questions', authMiddleware, contentManagerMiddleware, async (req, res) => {
    try {
        const question = new Question(req.body);
        await question.save();
        res.status(201).json(question);
    } catch (error) {
        console.error('Create question error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update question (Admin or Content Manager)
app.put('/api/questions/:id', authMiddleware, contentManagerMiddleware, async (req, res) => {
    try {
        const question = await Question.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        res.json(question);
    } catch (error) {
        console.error('Update question error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete question (admin only)
app.delete('/api/questions/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const question = await Question.findByIdAndDelete(req.params.id);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        res.json({ message: 'Question deleted successfully' });
    } catch (error) {
        console.error('Delete question error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== SUBJECT ROUTES ====================

// Get all subjects
app.get('/api/subjects', async (req, res) => {
    try {
        const { tetCategory } = req.query;
        const filter = tetCategory ? { tetCategory } : {};
        const subjects = await Subject.find(filter);
        res.json(subjects);
    } catch (error) {
        console.error('Get subjects error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create subject (admin only)
app.post('/api/subjects', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const subject = new Subject(req.body);
        await subject.save();
        res.status(201).json(subject);
    } catch (error) {
        console.error('Create subject error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update subject (admin only)
app.put('/api/subjects/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const subject = await Subject.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }
        res.json(subject);
    } catch (error) {
        console.error('Update subject error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete subject (admin only)
app.delete('/api/subjects/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const subject = await Subject.findByIdAndDelete(req.params.id);
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }
        res.json({ message: 'Subject deleted successfully' });
    } catch (error) {
        console.error('Delete subject error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== TOPIC ROUTES ====================

// Get all topics
app.get('/api/topics', async (req, res) => {
    try {
        const { subjectId } = req.query;
        const filter = subjectId ? { subjectId } : {};
        const topics = await Topic.find(filter);
        res.json(topics);
    } catch (error) {
        console.error('Get topics error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create topic (admin only)
app.post('/api/topics', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const topic = new Topic(req.body);
        await topic.save();
        res.status(201).json(topic);
    } catch (error) {
        console.error('Create topic error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update topic (admin only)
app.put('/api/topics/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const topic = await Topic.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!topic) {
            return res.status(404).json({ error: 'Topic not found' });
        }
        res.json(topic);
    } catch (error) {
        console.error('Update topic error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete topic (admin only)
app.delete('/api/topics/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const topic = await Topic.findByIdAndDelete(req.params.id);
        if (!topic) {
            return res.status(404).json({ error: 'Topic not found' });
        }
        res.json({ message: 'Topic deleted successfully' });
    } catch (error) {
        console.error('Delete topic error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== QUIZ ROUTES ====================

// Get quiz history
app.get('/api/quiz/history/:userId', authMiddleware, async (req, res) => {
    try {
        const history = await QuizLog.find({ userId: req.params.userId })
            .sort({ date: -1 });
        res.json(history);
    } catch (error) {
        console.error('Get quiz history error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Complete quiz and save results
app.post('/api/quiz/complete', authMiddleware, async (req, res) => {
    try {
        const quizLog = new QuizLog({
            userId: req.userId,
            subjectName: req.body.subjectName,
            score: req.body.score,
            totalQuestions: req.body.totalQuestions,
            correctCount: req.body.correctCount,
            incorrectCount: req.body.incorrectCount || 0,
            skippedCount: req.body.skippedCount || 0,
            accuracy: req.body.accuracy
        });
        await quizLog.save();
        res.status(201).json(quizLog);
    } catch (error) {
        console.error('Complete quiz error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== REPORT ROUTES ====================

// Get all reports (admin only)
app.get('/api/reports', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const reports = await IssueReport.find().sort({ date: -1 });
        res.json(reports);
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create issue report
app.post('/api/reports', authMiddleware, async (req, res) => {
    try {
        const report = new IssueReport({
            ...req.body,
            userId: req.userId
        });
        await report.save();
        res.status(201).json(report);
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update report status (admin only)
app.put('/api/reports/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const report = await IssueReport.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        res.json(report);
    } catch (error) {
        console.error('Update report error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== MESSAGE ROUTES ====================

// Get user messages
app.get('/api/messages/:userId', authMiddleware, async (req, res) => {
    try {
        const messages = await Message.find({ userId: req.params.userId })
            .sort({ date: 1 });
        res.json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all messages (admin only)
app.get('/api/messages', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const messages = await Message.find().sort({ date: -1 });
        res.json(messages);
    } catch (error) {
        console.error('Get all messages error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Send message
app.post('/api/messages', authMiddleware, async (req, res) => {
    try {
        const message = new Message(req.body);
        await message.save();
        res.status(201).json(message);
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Mark messages as read (Admin reading user messages)
app.put('/api/messages/mark-read/:userId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await Message.updateMany(
            { userId: req.params.userId, sender: 'user', isRead: false },
            { isRead: true }
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Mark messages as read (User reading admin messages)
app.put('/api/messages/mark-read-user/:userId', authMiddleware, async (req, res) => {
    try {
        if (req.userId !== req.params.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        await Message.updateMany(
            { userId: req.params.userId, sender: 'admin', isRead: false },
            { isRead: true }
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Mark read user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== NOTIFICATION ROUTES ====================

// Get active notifications
app.get('/api/notifications', async (req, res) => {
    try {
        const notifications = await Notification.find({ active: true });
        res.json(notifications);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update notification (admin only)
app.put('/api/notifications/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        res.json(notification);
    } catch (error) {
        console.error('Update notification error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create notification (admin only)
app.post('/api/notifications', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const notification = new Notification(req.body);
        await notification.save();
        res.status(201).json(notification);
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== SYLLABUS ROUTES ====================

// Get syllabus items
app.get('/api/syllabus', async (req, res) => {
    try {
        const { tetCategory } = req.query;
        const filter = tetCategory ? { tetCategory } : {};
        const syllabus = await Syllabus.find(filter).sort({ order: 1 });
        res.json(syllabus);
    } catch (error) {
        console.error('Get syllabus error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create syllabus item (admin only)
app.post('/api/syllabus', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const syllabusItem = new Syllabus(req.body);
        await syllabusItem.save();
        res.status(201).json(syllabusItem);
    } catch (error) {
        console.error('Create syllabus error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update syllabus item (admin only)
app.put('/api/syllabus/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const syllabusItem = await Syllabus.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!syllabusItem) {
            return res.status(404).json({ error: 'Syllabus item not found' });
        }
        res.json(syllabusItem);
    } catch (error) {
        console.error('Update syllabus error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete syllabus item (admin only)
app.delete('/api/syllabus/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const syllabusItem = await Syllabus.findByIdAndDelete(req.params.id);
        if (!syllabusItem) {
            return res.status(404).json({ error: 'Syllabus item not found' });
        }
        res.json({ message: 'Syllabus item deleted successfully' });
    } catch (error) {
        console.error('Delete syllabus error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'KTET Quiz API is running' });
});

// Database info (for debugging)
app.get('/api/db-info', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const dbName = mongoose.connection.db.databaseName;
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        res.json({
            connected: mongoose.connection.readyState === 1,
            database: dbName,
            collections: collectionNames,
            host: mongoose.connection.host,
            connectionString: process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') : 'Not set'
        });
    } catch (error) {
        console.error('DB info error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// For Vercel serverless
module.exports = app;

// For local development
if (require.main === module) {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
