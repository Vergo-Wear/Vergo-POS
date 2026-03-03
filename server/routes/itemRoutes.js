const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const auth = require('../middleware/auth');

// @route   GET /api/items
// @desc    Get all items
// @access  Public
router.get('/', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/items
// @desc    Add a new item
// @access  Private (Admin only)
router.post('/', auth, async (req, res) => {
  try {
    const { name, price, category, stock } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ message: 'Please provide name, price, and category.' });
    }

    const newItem = new Item({
      name,
      price,
      category,
      stock: stock || 0
    });

    const item = await newItem.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/items/:id/stock
// @desc    Update stock for an item
// @access  Private (Admin only)
router.put('/:id/stock', auth, async (req, res) => {
  try {
    const { stock } = req.body;
    
    if (stock === undefined) {
      return res.status(400).json({ message: 'Please provide stock quantity.' });
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: { stock: stock } },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/items/:id
// @desc    Update an entire item structure (name, price, category, stock)
// @access  Private (Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, price, category, stock } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (price !== undefined) updateData.price = price;
    if (category) updateData.category = category;
    if (stock !== undefined) updateData.stock = stock;

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/items/:id
// @desc    Delete an item
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }
    res.json({ message: 'Item deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
