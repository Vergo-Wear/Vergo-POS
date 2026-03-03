const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  items: [{
    name: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  customerEmail: {
    type: String,
    required: false
  },
  customerName: {
    type: String,
    required: false
  },
  orderNumber: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Sale', saleSchema);
