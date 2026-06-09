require('dotenv').config({ path: '../.env', override: true });
const express = require('express');
const { buildSchedule } = require('./scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({ status: "ok" });
});

app.get('/schedule', async (req, res) => {
  try {
    const schedule = await buildSchedule();
    res.json({ success: true, schedule });
  } catch (err) {
    res.status(502).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
