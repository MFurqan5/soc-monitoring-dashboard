const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

// GET /api/sessions/ip/:ip
// Fetch session metadata list from database session_recordings table
router.get("/ip/:ip", async (req, res) => {
  try {
    const { ip } = req.params;

    const query = `
      SELECT 
        session_id, 
        attacker_ip, 
        COUNT(*) as request_count,
        MIN(timestamp) as started_at, 
        MAX(timestamp) as ended_at
      FROM session_recordings 
      WHERE attacker_ip = $1
      GROUP BY session_id, attacker_ip 
      ORDER BY started_at DESC
    `;
    const result = await pool.query(query, [ip]);

    res.json({
      success: true,
      count: result.rows.length,
      sessions: result.rows.map(row => ({
        sessionId: row.session_id,
        attackerIp: row.attacker_ip,
        requestCount: parseInt(row.request_count),
        startTime: row.started_at,
        endTime: row.ended_at,
        duration: new Date(row.ended_at) - new Date(row.started_at)
      }))
    });
  } catch (err) {
    console.error("[sessions/ip/:ip] Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch attacker sessions" });
  }
});

// GET /api/sessions/:sessionId/timeline
// Get sequence of events with timeSincePrevious calculated in JavaScript
router.get("/:sessionId/timeline", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const query = `
      SELECT * FROM session_recordings 
      WHERE session_id = $1 
      ORDER BY sequence_number ASC
    `;
    const result = await pool.query(query, [sessionId]);

    const events = result.rows.map((row, index) => {
      let timeSincePrevious = "—";
      if (index > 0) {
        const current = new Date(row.timestamp);
        const previous = new Date(result.rows[index - 1].timestamp);
        const diffMs = current - previous;
        if (diffMs < 1000) {
          timeSincePrevious = `+${diffMs}ms`;
        } else {
          const diffSec = Math.floor(diffMs / 1000);
          if (diffSec < 60) {
            timeSincePrevious = `+${diffSec}s`;
          } else {
            const diffMin = Math.floor(diffSec / 60);
            const remSec = diffSec % 60;
            timeSincePrevious = `+${diffMin}m ${remSec}s`;
          }
        }
      }

      return {
        sequence: row.sequence_number,
        timestamp: row.timestamp,
        method: row.request_method,
        path: row.request_path,
        status: row.response_code,
        payload: row.request_body,
        timeSincePrevious
      };
    });

    res.json({
      success: true,
      timeline: {
        sessionId,
        events,
        summary: {
          total: events.length,
          successful: events.filter(e => e.status < 400).length,
          failed: events.filter(e => e.status >= 400).length
        }
      }
    });
  } catch (err) {
    console.error("[sessions/:sessionId/timeline] Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch session timeline" });
  }
});

// GET /api/sessions/:sessionId/forensics
// Export session as forensic data: recordings + attacker profile + detected attack types
router.get("/:sessionId/forensics", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const recordQuery = `
      SELECT * FROM session_recordings 
      WHERE session_id = $1 
      ORDER BY sequence_number ASC
    `;
    const recordResult = await pool.query(recordQuery, [sessionId]);

    if (recordResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }

    const attackerIp = recordResult.rows[0].attacker_ip;

    const [profileRes, attackTypesRes] = await Promise.all([
      pool.query("SELECT * FROM attacker_profiles WHERE ip = $1", [attackerIp]),
      pool.query("SELECT DISTINCT attack_type FROM attack_logs WHERE session_id = $1 AND attack_type IS NOT NULL", [sessionId])
    ]);

    const profile = profileRes.rows[0] || null;
    const attackTypes = attackTypesRes.rows.map(row => row.attack_type);

    res.json({
      success: true,
      session: recordResult.rows.map(row => ({
        sequence: row.sequence_number,
        timestamp: row.timestamp,
        method: row.request_method,
        path: row.request_path,
        status: row.response_code,
        payload: row.request_body
      })),
      profile,
      attackTypes
    });
  } catch (err) {
    console.error("[sessions/:sessionId/forensics] Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch session forensics" });
  }
});

module.exports = router;
