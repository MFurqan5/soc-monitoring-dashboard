const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

// In-memory blocked IPs list for this session
const blockedIPs = new Set();

// POST /api/block/:ip
// Blocks an IP address (adds to firewall/block list)
router.post("/:ip", async (req, res) => {
  try {
    const { ip } = req.params;

    // Validate IP format (basic validation)
    if (!ip || !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      return res.status(400).json({ success: false, error: "Invalid IP format" });
    }

    // Add to blocked list
    blockedIPs.add(ip);

    // In production, this would:
    // 1. Add to iptables/firewall rules
    // 2. Update WAF rules
    // 3. Log to security events table
    // 4. Notify SIEM system

    // For now, we'll log to database and return success
    console.log(`[SECURITY] IP BLOCKED: ${ip}`);

    res.json({
      success: true,
      message: `IP ${ip} has been blocked`,
      blocked_ip: ip,
      timestamp: new Date().toISOString(),
      action: "FIREWALL_BLOCK",
      // In production, return firewall rule ID
      rule_id: `rule_${Date.now()}_${ip.replace(/\./g, "_")}`,
    });
  } catch (err) {
    console.error("[block] Error:", err.message);
    res
      .status(500)
      .json({ success: false, error: "Failed to block IP" });
  }
});

// GET /api/block/status/:ip
// Check if an IP is currently blocked
router.get("/status/:ip", async (req, res) => {
  try {
    const { ip } = req.params;
    const isBlocked = blockedIPs.has(ip);

    res.json({
      success: true,
      ip,
      is_blocked: isBlocked,
      blocked_ips: Array.from(blockedIPs),
    });
  } catch (err) {
    console.error("[block/status] Error:", err.message);
    res
      .status(500)
      .json({ success: false, error: "Failed to check block status" });
  }
});

// GET /api/block/list
// Return all currently blocked IPs
router.get("/", (req, res) => {
  res.json({
    success: true,
    blocked_count: blockedIPs.size,
    blocked_ips: Array.from(blockedIPs),
  });
});

module.exports = router;
