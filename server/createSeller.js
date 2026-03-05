const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Seller = require('./models/Seller');

// ✏️ Change these before running!
const SELLER_USERNAME = 'seller';
const SELLER_PASSWORD = 'Vergo@POS2024';

async function createSeller() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const existing = await Seller.findOne({ username: SELLER_USERNAME });
    if (existing) {
      console.log('⚠️  Seller already exists with username:', SELLER_USERNAME);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(SELLER_PASSWORD, salt);

    const seller = new Seller({
      username: SELLER_USERNAME,
      password: hashedPassword,
    });

    await seller.save();
    console.log('✅ Seller created successfully!');
    console.log('   Username:', SELLER_USERNAME);
    console.log('   Password:', SELLER_PASSWORD);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createSeller();
