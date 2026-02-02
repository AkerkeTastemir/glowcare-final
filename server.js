require('dotenv').config();

const express = require('express');
const cors = require('cors');

const connectDB = require('./src/db');

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// test route
app.get('/', (req, res) => {
  res.json({ message: 'GlowCare API is running' });
});

const PORT = process.env.PORT || 3000;

// start server
const startServer = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();