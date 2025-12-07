import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function clearSubjects() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected successfully!');

        const dbName = mongoose.connection.db.databaseName;
        console.log(`\n📊 Database: ${dbName}`);

        // Count subjects before deletion
        const beforeCount = await mongoose.connection.db.collection('subjects').countDocuments();
        console.log(`\n📁 Subjects before deletion: ${beforeCount} documents`);

        if (beforeCount === 0) {
            console.log('✓ No subjects to delete');
        } else {
            // Delete all subjects
            const result = await mongoose.connection.db.collection('subjects').deleteMany({});
            console.log(`\n✅ Deleted ${result.deletedCount} subjects successfully!`);
        }

        // Verify deletion
        const afterCount = await mongoose.connection.db.collection('subjects').countDocuments();
        console.log(`\n📁 Subjects after deletion: ${afterCount} documents`);

        await mongoose.connection.close();
        console.log('\n✓ Connection closed');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

clearSubjects();
