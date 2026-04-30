const express = require("express");
const cors = require("cors");
const pool = require("./config/db"); // Import the pool
const app = express();

app.use(cors());
app.use(express.json());

// Test Route: Check if DB is alive
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, serverTime: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("HelpOrbit API running...");
});

module.exports = app;