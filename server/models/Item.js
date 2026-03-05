const mongoose = require('mongoose');

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

// Use a plain nested object schema instead of Map for easier JSON serialisation
const stockFields = {};
SIZES.forEach(size => {
  stockFields[size] = { type: Number, default: 0, min: 0 };
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
    type: new mongoose.Schema(stockFields, { _id: false }),
    default: () => {
      const s = {};
      SIZES.forEach(sz => s[sz] = 0);
      return s;
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
module.exports.SIZES = SIZES;
