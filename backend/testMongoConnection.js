const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...\n');
    console.log('Connection string:', process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

    await mongoose.connect(process.env.MONGODB_URI);

    console.log('\n✅ SUCCESS! Connected to MongoDB');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);

    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections found:', collections.length);
    collections.forEach(col => {
      console.log('  -', col.name);
    });

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ FAILED! Error connecting to MongoDB');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Check your connection string in .env');
    console.error('  2. Ensure password is correct (no special chars need escaping)');
    console.error('  3. Check Network Access in MongoDB Atlas (allow 0.0.0.0/0)');
    console.error('  4. Verify database user was created');
    process.exit(1);
  }
}

testConnection();
