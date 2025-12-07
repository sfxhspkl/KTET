import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function listAllDatabases() {
    try {
        console.log('Connecting to MongoDB Atlas...');

        // Connect without specifying database
        const baseUri = process.env.MONGODB_URI.replace(/\/[^\/]*\?/, '/?');
        await mongoose.connect(baseUri);
        console.log('✓ Connected successfully!\n');

        // List all databases
        const adminDb = mongoose.connection.db.admin();
        const { databases } = await adminDb.listDatabases();

        console.log(`📊 Found ${databases.length} databases:\n`);

        for (const db of databases) {
            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`📁 Database: ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

            const database = mongoose.connection.client.db(db.name);
            const collections = await database.listCollections().toArray();

            if (collections.length === 0) {
                console.log('  (empty database)');
                continue;
            }

            console.log(`  Collections (${collections.length}):`);
            for (const collection of collections) {
                const count = await database.collection(collection.name).countDocuments();
                console.log(`    - ${collection.name}: ${count} documents`);

                // If it's users collection, show the users
                if (collection.name === 'users' && count > 0) {
                    const users = await database.collection('users').find({}, { projection: { username: 1, role: 1, name: 1 } }).limit(10).toArray();
                    console.log(`      Users:`);
                    users.forEach(user => {
                        console.log(`        • ${user.username} (${user.role})`);
                    });
                }
            }
        }

        await mongoose.connection.close();
        console.log('\n\n✓ Connection closed');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

listAllDatabases();
