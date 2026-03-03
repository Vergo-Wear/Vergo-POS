const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const DailyReport = require('../models/DailyReport');
const auth = require('../middleware/auth');

// @route   GET /api/sales/reports
// @desc    Get all archived daily reports
// @access  Private (Admin only)
router.get('/reports', auth, async (req, res) => {
  try {
    const reports = await DailyReport.find().sort({ reportDate: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/sales
// @desc    Get all active sales
// @access  Private (Admin only)
router.get('/', auth, async (req, res) => {
  try {
    const sales = await Sale.find().sort({ date: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/sales
// @desc    Record a new sale
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { items, subtotalAmount, discountAmount, totalAmount, customerEmail, customerName, orderNumber } = req.body;

    if (!items || !totalAmount || !orderNumber) {
      return res.status(400).json({ message: 'Missing required sale data (items, amount, or order number).' });
    }

    // Validate stock availability for all items before saving
    const Item = require('../models/Item');
    for (const saleItem of items) {
      if (!saleItem.id && !saleItem._id) continue;
      const itemId = saleItem.id || saleItem._id;
      const dbItem = await Item.findById(itemId);
      if (!dbItem) continue;
      if (dbItem.stock < saleItem.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for "${dbItem.name}". Available: ${dbItem.stock}, Requested: ${saleItem.quantity}`
        });
      }
    }

    const newSale = new Sale({
      items,
      subtotalAmount: subtotalAmount || totalAmount,
      discountAmount: discountAmount || 0,
      totalAmount,
      customerEmail: customerEmail || 'N/A',
      customerName: customerName || 'Guest',
      orderNumber
    });

    const sale = await newSale.save();

    // Decrement stock for each sold item
    for (const saleItem of items) {
      const itemId = saleItem.id || saleItem._id;
      if (!itemId) continue;
      await Item.findByIdAndUpdate(itemId, {
        $inc: { stock: -saleItem.quantity }
      });
    }

    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/sales/reset
// @desc    Archive and reset all sales
// @access  Private (Admin only)
router.delete('/reset', auth, async (req, res) => {
  try {
    const activeSales = await Sale.find({});
    
    if (activeSales.length === 0) {
      return res.status(400).json({ message: 'No active sales to reset.' });
    }

    const totalRevenue = activeSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalOrders = activeSales.length;
    const totalDiscounts = activeSales.reduce((sum, s) => sum + (s.discountAmount || 0), 0);

    // Create Archive Report
    const reportData = activeSales.map(s => ({
      orderNumber: s.orderNumber,
      customerName: s.customerName,
      subtotalAmount: s.subtotalAmount || s.totalAmount,
      discountAmount: s.discountAmount || 0,
      totalAmount: s.totalAmount,
      date: s.date
    }));

    const newReport = new DailyReport({
      totalRevenue,
      totalOrders,
      totalDiscounts,
      sales: reportData
    });

    await newReport.save();

    // Now clear the active sales
    await Sale.deleteMany({});
    
    res.json({ message: 'Sales archived and reset successfully.', report: newReport });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
