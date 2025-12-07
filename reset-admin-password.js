import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

async function resetAdminPassword() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected successfully!');

        const dbName = mongoose.connection.db.databaseName;
        console.log(`\n📊 Database: ${dbName}`);

        // Find admin user
        const admin = await mongoose.connection.db.collection('users').findOne({ username: 'admin' });

        if (!admin) {
            console.log('❌ Admin user not found!');
            await mongoose.connection.close();
            return;
        }

        console.log(`\n👤 Admin user found:`);
        console.log(`   Username: ${admin.username}`);
        console.log(`   Name: ${admin.name}`);
        console.log(`   Role: ${admin.role}`);

        // Hash new password
        const newPassword = 'admin';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        const result = await mongoose.connection.db.collection('users').updateOne(
            { username: 'admin' },
            { $set: { password: hashedPassword } }
        );

        if (result.modifiedCount > 0) {
            console.log(`\n✅ Admin password reset successfully!`);
            console.log(`   New password: ${newPassword}`);
        } else {
            console.log(`\n⚠️ Password was not changed (might already be the same)`);
        }

        await mongoose.connection.close();
        console.log('\n✓ Connection closed');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

resetAdminPassword();
