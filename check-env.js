import dotenv from 'dotenv';
dotenv.config();

console.log('=== Environment Variables Check ===');
console.log('MONGODB_URI:', process.env.MONGODB_URI ?
    process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') :
    'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '***SET***' : 'NOT SET');
console.log('PORT:', process.env.PORT || '3001 (default)');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('===================================');

// Extract database name from URI
if (process.env.MONGODB_URI) {
    try {
        const match = process.env.MONGODB_URI.match(/\.net\/([^?]+)/);
        if (match && match[1]) {
            console.log('Database name from URI:', match[1]);
        } else {
            console.log('Database name: Using default (test)');
        }
    } catch (e) {
        console.log('Could not parse database name');
    }
}
