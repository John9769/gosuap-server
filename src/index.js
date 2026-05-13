const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes'); // New

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes); // New

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('GoSuap Server is Running!');
});

app.listen(PORT, () => {
  console.log(`Server is moving on port ${PORT}`);
});