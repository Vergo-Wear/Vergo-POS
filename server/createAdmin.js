const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const Admin = require('./models/Admin');

// ✏️ Change these before running!
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Vergo@2024';

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const existing = await Admin.findOne({ username: ADMIN_USERNAME });
    if (existing) {
      console.log('⚠️  Admin already exists with username:', ADMIN_USERNAME);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    const admin = new Admin({
      username: ADMIN_USERNAME,
      password: hashedPassword,
    });

    await admin.save();
    console.log('✅ Admin created successfully!');
    console.log('   Username:', ADMIN_USERNAME);
    console.log('   Password:', ADMIN_PASSWORD);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();
