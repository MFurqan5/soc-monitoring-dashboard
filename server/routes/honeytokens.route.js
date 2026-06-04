const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

// GET /api/honeytokens
// Fetch all honeytokens and their trigger status
router.get("/", async (req, res) => {
  try {
    const query = `
      SELECT h.*, ha.triggered_at as alert_triggered_at, ha.details as alert_details
      FROM honeytokens h
      LEFT JOIN honeytoken_alerts ha ON h.id = ha.honeytoken_id
      ORDER BY h.created_at DESC
    `;
    const result = await pool.query(query);

    res.json({
      success: true,
      honeytokens: result.rows
    });
  } catch (err) {
    console.error("[honeytokens] Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch honeytokens" });
  }
});

// GET /api/honeytokens/triggered
// Fetch triggered honeytoken alerts only
router.get("/triggered", async (req, res) => {
  try {
    const query = `
      SELECT h.*, ha.triggered_at, ha.severity, ha.details
      FROM honeytokens h
      JOIN honeytoken_alerts ha ON h.id = ha.honeytoken_id
      ORDER BY ha.triggered_at DESC
    `;
    const result = await pool.query(query);

    res.json({
      success: true,
      triggered: result.rows
    });
  } catch (err) {
    console.error("[honeytokens/triggered] Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch triggered honeytokens" });
  }
});

module.exports = router;
