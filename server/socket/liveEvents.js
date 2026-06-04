const { Server } = require("socket.io");
const pool = require("../db/connection");

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  console.log("✓ Socket.io server initialised");

  // Keep track of timestamps for changes
  let lastAttackCheck = new Date();
  let lastHoneytokenCheck = new Date();

  // Helper to fetch statistics payload
  async function getStatsPayload() {
    const [
      totalEvents,
      attackBreakdown,
      severityBreakdown,
      timelineData,
      topAttackers,
      topCountries,
      recentActivity,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total FROM attack_logs`),
      pool.query(`
        SELECT attack_type, COUNT(*) AS count
        FROM attack_logs
        GROUP BY attack_type
        ORDER BY count DESC
      `),
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
      pool.query(`
        SELECT
          DATE_TRUNC('hour', timestamp) AS hour,
          COUNT(*) AS count
        FROM attack_logs
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
        GROUP BY hour
        ORDER BY hour ASC
      `),
      pool.query(`
        SELECT source_ip, COUNT(*) AS count
        FROM attack_logs
        GROUP BY source_ip
        ORDER BY count DESC
        LIMIT 5
      `),
      pool.query(`
        SELECT country, COUNT(*) AS count
        FROM attacker_profiles
        WHERE country IS NOT NULL
        GROUP BY country
        ORDER BY count DESC
        LIMIT 5
      `),
      pool.query(`
        SELECT COUNT(*) AS count
        FROM attack_logs
        WHERE timestamp >= NOW() - INTERVAL '10 minutes'
      `),
    ]);

    const severityRows = severityBreakdown.rows;
    const getCount = (level) => {
      const row = severityRows.find((r) => r.severity_label === level);
      return row ? parseInt(row.count) : 0;
    };

    const criticalCount = getCount("CRITICAL");
    const highCount = getCount("HIGH");
    const mediumCount = getCount("MEDIUM");
    const lowCount = getCount("LOW");
    const totalCount = parseInt(totalEvents.rows[0].total) || 1;

    const rawScore = criticalCount * 4 + highCount * 3 + mediumCount * 2 + lowCount * 1;
    const threatScore = Math.min(100, Math.round((rawScore / (totalCount * 4)) * 100));

    const { calculateThreatScore } = require("../services/threatScoring.service");
    const topAttackersDetailed = await Promise.all(
      topAttackers.rows.map(async (attacker) => {
        const ip = attacker.source_ip;
        const profileRes = await pool.query("SELECT * FROM attacker_profiles WHERE ip = $1", [ip]);
        const attacksRes = await pool.query("SELECT * FROM attack_logs WHERE source_ip = $1 ORDER BY timestamp DESC LIMIT 50", [ip]);
        
        if (profileRes.rows.length > 0) {
          const profile = profileRes.rows[0];
          const calculatedThreatScore = calculateThreatScore(profile, attacksRes.rows);
          return {
            ...attacker,
            threat_score: profile.threat_score,
            calculatedThreatScore,
            country: profile.country,
            city: profile.city
          };
        }
        return {
          ...attacker,
          threat_score: 0,
          calculatedThreatScore: 0
        };
      })
    );

    return {
      totalEvents: parseInt(totalEvents.rows[0].total),
      recentActivity: parseInt(recentActivity.rows[0].count),
      threatScore,
      attackBreakdown: attackBreakdown.rows,
      severityBreakdown: severityBreakdown.rows,
      timeline: timelineData.rows,
      topAttackers: topAttackersDetailed,
      topCountries: topCountries.rows,
    };
  }

  // 1. Attack Log Polling (Every 3 seconds)
  setInterval(async () => {
    try {
      const query = `
        SELECT * FROM attack_logs 
        WHERE timestamp > $1 
        ORDER BY timestamp ASC
      `;
      const result = await pool.query(query, [lastAttackCheck]);

      if (result.rows.length > 0) {
        // Emit new attacks to all connected clients
        io.emit("new_attack", { events: result.rows });
        // Update last check to the timestamp of the latest event
        lastAttackCheck = new Date(result.rows[result.rows.length - 1].timestamp);
      }
    } catch (err) {
      console.error("[Socket polling] attack_logs error:", err.message);
    }
  }, 3000);

  // 2. Honeytoken Alert Polling (Every 5 seconds)
  setInterval(async () => {
    try {
      const query = `
        SELECT 
          ha.attacker_ip as ip, 
          h.type, 
          ha.triggered_at as "triggeredAt", 
          ha.severity
        FROM honeytoken_alerts ha
        JOIN honeytokens h ON ha.honeytoken_id = h.id
        WHERE ha.triggered_at > $1
        ORDER BY ha.triggered_at ASC
      `;
      const result = await pool.query(query, [lastHoneytokenCheck]);

      if (result.rows.length > 0) {
        result.rows.forEach(alert => {
          io.emit("honeytoken_triggered", {
            ip: alert.ip,
            type: alert.type,
            triggeredAt: alert.triggeredAt,
            severity: alert.severity || 'CRITICAL'
          });
        });
        lastHoneytokenCheck = new Date(result.rows[result.rows.length - 1].triggeredAt);
      }
    } catch (err) {
      console.error("[Socket polling] honeytoken_alerts error:", err.message);
    }
  }, 5000);

  // 3. Stats Update Polling (Every 10 seconds)
  setInterval(async () => {
    try {
      const stats = await getStatsPayload();
      io.emit("stats_update", stats);
    } catch (err) {
      console.error("[Socket polling] stats error:", err.message);
    }
  }, 10000);

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    
    // Send initial stats on connection
    getStatsPayload()
      .then(stats => socket.emit("stats_update", stats))
      .catch(err => console.error("Error sending initial socket stats:", err.message));

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

module.exports = { initSocket };
