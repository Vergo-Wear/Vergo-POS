const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Initial setup route (Use this once to create the first admin, then delete or secure it)
router.post('/setup', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if an admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin user already exists.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the admin user
    const admin = new Admin({
      username,
      password: hashedPassword
    });

    await admin.save();
    res.status(201).json({ message: 'Admin user created successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the admin user
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Validate the password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { adminId: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, username: admin.username });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
