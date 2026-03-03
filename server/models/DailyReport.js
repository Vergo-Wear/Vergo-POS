const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
  reportDate: {
    type: Date,
    default: Date.now
  },
  totalRevenue: {
    type: Number,
    required: true
  },
  totalOrders: {
    type: Number,
    required: true
  },
  sales: [{
    orderNumber: String,
    customerName: String,
    totalAmount: Number,
    date: Date
  }]
});

module.exports = mongoose.model('DailyReport', dailyReportSchema);
