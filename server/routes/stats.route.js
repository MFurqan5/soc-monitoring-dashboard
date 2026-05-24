const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

// GET /api/stats
// Returns all aggregated numbers your charts need in one single call
// React dashboard calls this once every 5 seconds

router.get("/", async (req, res) => {
  try {
    // Run all queries in parallel — much faster than one by one
    const [
      totalEvents,
      attackBreakdown,
      severityBreakdown,
      timelineData,
      topAttackers,
      topCountries,
      recentActivity,
    ] = await Promise.all([
      // 1. Total attack count
      pool.query(`SELECT COUNT(*) AS total FROM attack_logs`),

      // 2. Count per attack type → for donut/bar chart
      pool.query(`
        SELECT attack_type, COUNT(*) AS count
        FROM attack_logs
        GROUP BY attack_type
        ORDER BY count DESC
      `),

      // 3. Count per severity level → for threat gauge
      pool.query(`
        SELECT severity, COUNT(*) AS count
        FROM attack_logs
        GROUP BY severity
        ORDER BY CASE severity
          WHEN 'CRITICAL' THEN 1
          WHEN 'HIGH'     THEN 2
          WHEN 'MEDIUM'   THEN 3
          WHEN 'LOW'      THEN 4
          ELSE 5
        END
      `),

      // 4. Attacks per hour for last 24 hours → for timeline chart
      pool.query(`
        SELECT
          DATE_TRUNC('hour', timestamp) AS hour,
          COUNT(*) AS count
        FROM attack_logs
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
        GROUP BY hour
        ORDER BY hour ASC
      `),

      // 5. Top 5 most active attacker IPs
      pool.query(`
        SELECT source_ip, COUNT(*) AS count
        FROM attack_logs
        GROUP BY source_ip
        ORDER BY count DESC
        LIMIT 5
      `),

      // 6. Top 5 attacking countries → for world map summary
      pool.query(`
        SELECT country, COUNT(*) AS count
        FROM attacker_profiles
        WHERE country IS NOT NULL
        GROUP BY country
        ORDER BY count DESC
        LIMIT 5
      `),

      // 7. Attacks in last 10 minutes → shows if system is under attack RIGHT NOW
      pool.query(`
        SELECT COUNT(*) AS count
        FROM attack_logs
        WHERE timestamp >= NOW() - INTERVAL '10 minutes'
      `),
    ]);

    // Calculate a simple overall threat level (0–100) from severity breakdown
    const severityRows = severityBreakdown.rows;
    const getCount = (level) => {
      const row = severityRows.find((r) => r.severity === level);
      return row ? parseInt(row.count) : 0;
    };

    const criticalCount = getCount("CRITICAL");
    const highCount = getCount("HIGH");
    const mediumCount = getCount("MEDIUM");
    const lowCount = getCount("LOW");
    const totalCount = parseInt(totalEvents.rows[0].total) || 1;

    // Weighted score: CRITICAL=4pts HIGH=3pts MEDIUM=2pts LOW=1pt, capped at 100
    const rawScore =
      criticalCount * 4 + highCount * 3 + mediumCount * 2 + lowCount * 1;
    const threatScore = Math.min(
      100,
      Math.round((rawScore / (totalCount * 4)) * 100),
    );

    res.json({
      success: true,
      data: {
        totalEvents: parseInt(totalEvents.rows[0].total),
        recentActivity: parseInt(recentActivity.rows[0].count), // last 10 mins
        threatScore, // 0–100 for gauge
        attackBreakdown: attackBreakdown.rows, // [{attack_type, count}]
        severityBreakdown: severityBreakdown.rows, // [{severity, count}]
        timeline: timelineData.rows, // [{hour, count}]
        topAttackers: topAttackers.rows, // [{source_ip, count}]
        topCountries: topCountries.rows, // [{country, count}]
      },
    });
  } catch (err) {
    console.error("[stats] DB error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
});

module.exports = router;
