const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Seller = require('../models/Seller');

// Initial setup route for seller
router.post('/setup', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const existingSeller = await Seller.findOne({ username });
    if (existingSeller) {
      return res.status(400).json({ message: 'Seller already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const seller = new Seller({
      username,
      password: hashedPassword
    });

    await seller.save();
    res.status(201).json({ message: 'Seller created successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login route for seller
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const seller = await Seller.findOne({ username });
    if (!seller) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { sellerId: seller._id, username: seller.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, username: seller.username });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
