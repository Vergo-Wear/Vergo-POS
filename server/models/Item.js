const mongoose = require('mongoose');

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

const sizeStockSchema = {};
SIZES.forEach(size => {
  sizeStockSchema[size] = { type: Number, default: 0, min: 0 };
});

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  stock: {
    type: Map,
    of: Number,
    default: () => {
      const s = {};
      SIZES.forEach(sz => s[sz] = 0);
      return s;
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
module.exports.SIZES = SIZES;
