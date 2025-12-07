import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected successfully!');

        const dbName = mongoose.connection.db.databaseName;
        console.log(`\n📊 Database Name: ${dbName}`);

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`\n📁 Collections (${collections.length}):`);

        for (const collection of collections) {
            const count = await mongoose.connection.db.collection(collection.name).countDocuments();
            console.log(`  - ${collection.name}: ${count} documents`);
        }

        // Check users collection specifically
        if (collections.find(c => c.name === 'users')) {
            console.log('\n👥 Users in database:');
            const users = await mongoose.connection.db.collection('users').find({}, { projection: { username: 1, role: 1, name: 1 } }).toArray();
            users.forEach(user => {
                console.log(`  - ${user.username} (${user.role}) - ${user.name || 'No name'}`);
            });
        }

        await mongoose.connection.close();
        console.log('\n✓ Connection closed');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkDatabase();
