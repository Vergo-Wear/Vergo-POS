const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vergo';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    app.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
  });

// Routes
app.get('/', (req, res) => {
  res.send('Vergo POS API is running.');
});

// Import routes
const adminRoutes = require('./routes/adminRoutes');
const itemRoutes = require('./routes/itemRoutes');
const saleRoutes = require('./routes/saleRoutes');

app.use('/api/admin', adminRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/sales', saleRoutes);
