const express = require("express");
const router = express.Router();
const { exec } = require("child_process");

// POST /api/block/:ip
router.post("/:ip", async (req, res) => {
  try {
    const { ip } = req.params;

    // Validate IPv4 format
    if (!ip || !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      return res.status(400).json({ success: false, error: "Invalid IP address format" });
    }

    // Execute iptables rules to drop incoming and outgoing traffic from/to IP
    exec(`iptables -A INPUT -s ${ip} -j DROP`, (err1) => {
      if (err1) {
        return res.status(500).json({
          success: false,
          error: "Insufficient permissions — server must run as root"
        });
      }

      exec(`iptables -A OUTPUT -d ${ip} -j DROP`, (err2) => {
        if (err2) {
          return res.status(500).json({
            success: false,
            error: "Insufficient permissions — server must run as root"
          });
        }

        return res.json({
          success: true,
          ip,
          blockedAt: new Date().toISOString()
        });
      });
    });
  } catch (err) {
    console.error("[block] Error:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to block IP"
    });
  }
});

// GET /api/block/status/:ip
router.get("/status/:ip", async (req, res) => {
  try {
    const { ip } = req.params;

    // Validate IPv4 format
    if (!ip || !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      return res.status(400).json({ success: false, error: "Invalid IP address format" });
    }

    exec("iptables -L INPUT -n", (err, stdout) => {
      if (err) {
        // Return not blocked if query fails, along with error info
        return res.json({
          blocked: false,
          ip
        });
      }

      const blocked = stdout.includes(ip);
      return res.json({
        blocked,
        ip
      });
    });
  } catch (err) {
    console.error("[block/status] Error:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to check block status"
    });
  }
});

module.exports = router;
