const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

// GET /api/attackers
// Returns all attacker profiles, sorted by threat score (highest first)
// Optional query params:
//   ?country=CN         → filter by country
//   ?is_known_malicious=true → only known bad IPs

router.get("/", async (req, res) => {
  try {
    const { country, is_known_malicious } = req.query;

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (country) {
      conditions.push(`country = $${paramIndex++}`);
      values.push(country);
    }

    if (is_known_malicious !== undefined) {
      conditions.push(`is_known_malicious = $${paramIndex++}`);
      values.push(is_known_malicious === "true");
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      SELECT
        ip,
        first_seen,
        last_seen,
        total_requests,
        threat_score,
        country,
        city,
        isp,
        os,
        tool,
        is_known_malicious,
        sqli_count,
        xss_count,
        bruteforce_count,
        traversal_count,
        latitude,
        longitude
      FROM attacker_profiles
      ${whereClause}
      ORDER BY threat_score DESC, last_seen DESC
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    console.error("[attackers] DB error:", err.message);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch attackers" });
  }
});

// GET /api/attackers/:ip
// Returns full profile for a single IP + their last 20 attacks
router.get("/:ip", async (req, res) => {
  try {
    const { ip } = req.params;

    // Profile row
    const profileResult = await pool.query(
      `SELECT * FROM attacker_profiles WHERE ip = $1`,
      [ip],
    );

    if (profileResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Attacker not found" });
    }

    // Their last 20 attack events
    const eventsResult = await pool.query(
      `SELECT * FROM attack_logs
       WHERE source_ip = $1
       ORDER BY timestamp DESC
       LIMIT 20`,
      [ip],
    );

    res.json({
      success: true,
      profile: profileResult.rows[0],
      events: eventsResult.rows,
    });
  } catch (err) {
    console.error("[attackers/:ip] DB error:", err.message);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch attacker profile" });
  }
});

module.exports = router;
