const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

// GET /api/events
// Returns latest attack logs, newest first
// Optional query params:
//   ?limit=50        → how many rows (default 50)
//   ?attack_type=sqli → filter by attack type
//   ?severity=CRITICAL → filter by severity

router.get("/", async (req, res) => {
  try {
    const { limit = 50, attack_type, severity } = req.query;

    // Build query dynamically based on filters
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (attack_type) {
      conditions.push(`attack_type = $${paramIndex++}`);
      values.push(attack_type);
    }

    if (severity) {
      conditions.push(`severity = $${paramIndex++}`);
      values.push(severity);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    values.push(parseInt(limit));

    const query = `
      SELECT
        id,
        timestamp,
        source_ip,
        source_port,
        method,
        path,
        payload,
        attack_type,
        severity,
        user_agent,
        tool_detected,
        os_fingerprint,
        session_id,
        response_code
      FROM attack_logs
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex}
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    console.error("[events] DB error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch events" });
  }
});

// GET /api/events/latest
// Returns only the single most recent attack (used by Socket.io polling fallback)
router.get("/latest", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM attack_logs
      ORDER BY timestamp DESC
      LIMIT 1
    `);

    res.json({
      success: true,
      data: result.rows[0] || null,
    });
  } catch (err) {
    console.error("[events/latest] DB error:", err.message);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch latest event" });
  }
});

module.exports = router;
