const mongoose = require('mongoose');

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

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
  // Mixed type: stores plain JS object { XS:5, S:0, ... } or legacy number
  // Mixed serialises exactly as stored — no subdoc quirks
  stock: {
    type: mongoose.Schema.Types.Mixed,
    default: () => {
      const s = {};
      SIZES.forEach(sz => s[sz] = 0);
      return s;
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
module.exports.SIZES = SIZES;
