require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/db');

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/user');
const productRoutes = require('./src/routes/products');
const orderRoutes = require('./src/routes/orders');

const { errorHandler } = require('./src/middleware');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public', 'pages', 'home.html'));
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();