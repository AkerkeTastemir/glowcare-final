require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./src/db');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'GlowCare API is running' });
});

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  })
}

start();