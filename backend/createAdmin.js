const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./src/models/User');

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'developer@gmail.com' });

    if (existingAdmin) {
      console.log('❌ Admin user already exists with email: developer@gmail.com');
      console.log('Updating password...');

      // Update the password
      const hashedPassword = await bcrypt.hash('dev123', 10);
      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'admin';
      existingAdmin.status = 'active';
      await existingAdmin.save();

      console.log('✓ Admin password updated successfully');
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash('dev123', 10);

      // Create admin user
      const admin = new User({
        name: 'Developer Admin',
        email: 'developer@gmail.com',
        password: hashedPassword,
        role: 'admin',
        status: 'active'
      });

      await admin.save();
      console.log('✓ Admin user created successfully!');
    }

    console.log('\n========================================');
    console.log('ADMIN CREDENTIALS');
    console.log('========================================');
    console.log('Email:    developer@gmail.com');
    console.log('Password: dev123');
    console.log('Role:     admin');
    console.log('========================================\n');

    mongoose.connection.close();
    console.log('✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
