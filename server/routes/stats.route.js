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
        WHERE attack_type IS NOT NULL
        GROUP BY attack_type
        ORDER BY count DESC
      `),

      // 3. Count per severity level → for threat gauge
      pool.query(`
        SELECT severity_label, COUNT(*) AS count
        FROM attack_logs
        GROUP BY severity_label
        ORDER BY CASE severity_label
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
    const severityRows = severityBreakdown?.rows || [];
    const getCount = (level) => {
      const row = severityRows.find((r) => r.severity_label === level);
      return row ? parseInt(row.count) : 0;
    };

    const criticalCount = getCount("CRITICAL");
    const highCount = getCount("HIGH");
    const mediumCount = getCount("MEDIUM");
    const lowCount = getCount("LOW");
    const totalCount = parseInt(totalEvents?.rows?.[0]?.total) || 1;

    // Weighted score: CRITICAL=4pts HIGH=3pts MEDIUM=2pts LOW=1pt, capped at 100
    const rawScore =
      criticalCount * 4 + highCount * 3 + mediumCount * 2 + lowCount * 1;
    const threatScore = Math.min(
      100,
      Math.round((rawScore / (totalCount * 4)) * 100),
    );

    const { calculateThreatScore } = require("../services/threatScoring.service");
    const topAttackersDetailed = await Promise.all(
      (topAttackers?.rows || []).map(async (attacker) => {
        const ip = attacker.source_ip;
        try {
          const profileRes = await pool.query("SELECT * FROM attacker_profiles WHERE ip = $1", [ip]);
          const attacksRes = await pool.query("SELECT * FROM attack_logs WHERE source_ip = $1 ORDER BY timestamp DESC LIMIT 50", [ip]);
          
          if (profileRes?.rows?.length > 0) {
            const profile = profileRes.rows[0];
            const calculatedThreatScore = calculateThreatScore(profile, attacksRes?.rows || []);
            return {
              ...attacker,
              threat_score: profile.threat_score || 0,
              calculatedThreatScore: calculatedThreatScore || 0,
              country: profile.country || 'Unknown',
              city: profile.city || 'Unknown'
            };
          }
          return {
            ...attacker,
            threat_score: 0,
            calculatedThreatScore: 0,
            country: 'Unknown',
            city: 'Unknown'
          };
        } catch (err) {
          console.error(`Error fetching details for IP ${ip}:`, err.message);
          return {
            ...attacker,
            threat_score: 0,
            calculatedThreatScore: 0,
            country: 'Unknown',
            city: 'Unknown'
          };
        }
      })
    );

    res.json({
      success: true,
      data: {
        totalEvents: parseInt(totalEvents?.rows?.[0]?.total) || 0,
        recentActivity: parseInt(recentActivity?.rows?.[0]?.count) || 0, // last 10 mins
        threatScore: isNaN(threatScore) ? 0 : threatScore, // 0–100 for gauge
        attackBreakdown: attackBreakdown?.rows || [], // [{attack_type, count}]
        severityBreakdown: severityBreakdown?.rows || [], // [{severity_label, count}]
        timeline: timelineData?.rows || [], // [{hour, count}]
        topAttackers: topAttackersDetailed, // [{source_ip, count, threat_score, calculatedThreatScore, country, city}]
        topCountries: topCountries?.rows || [], // [{country, count}]
      },
    });
  } catch (err) {
    console.error("[stats] DB error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
});

module.exports = router;