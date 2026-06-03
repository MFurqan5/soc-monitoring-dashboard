const express = require("express");
const router = express.Router();
const HoneyTokenService = require("../services/honeytokens.service");

// POST /api/honeytokels/create
// Create a new honeytoken (fake credential/API key/file)
router.post("/create", (req, res) => {
  try {
    const { type = "credential", attackerIp = "unknown" } = req.body;

    // Validate type
    const validTypes = ["credential", "api_key", "file", "config"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid type. Must be credential, api_key, file, or config",
      });
    }

    const honeytoken = HoneyTokenService.createHoneytoken(type, attackerIp);

    res.json({
      success: true,
      honeytoken,
      message: "Honeytoken created - now embedded in honeypot responses",
    });
  } catch (err) {
    console.error("[honeytokels/create] Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to create honeytoken" });
  }
});

// GET /api/honeytokels
// Get all active honeytokels
router.get("/", (req, res) => {
  try {
    const honeytokels = HoneyTokenService.getAllHoneytokels();

    res.json({
      success: true,
      count: honeytokels.length,
      honeytokels,
    });
  } catch (err) {
    console.error("[honeytokels] Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch honeytokels" });
  }
});

// GET /api/honeytokels/triggered
// Get honeytokels that have been used/triggered by attackers
router.get("/triggered", (req, res) => {
  try {
    const triggered = HoneyTokenService.getTriggeredHoneytokels();

    res.json({
      success: true,
      count: triggered.length,
      triggered,
      message: "These honeytokels were detected being used by attackers!",
    });
  } catch (err) {
    console.error("[honeytokels/triggered] Error:", err.message);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch triggered honeytokels" });
  }
});

// GET /api/honeytokels/:id
// Get details of a specific honeytoken
router.get("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const honeytoken = HoneyTokenService.getHoneytoken(id);

    if (!honeytoken) {
      return res
        .status(404)
        .json({ success: false, error: "Honeytoken not found" });
    }

    res.json({
      success: true,
      honeytoken,
    });
  } catch (err) {
    console.error("[honeytokels/:id] Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch honeytoken" });
  }
});

// POST /api/honeytokels/:id/trigger
// Trigger alert - call this when honeytoken is detected being used
router.post("/:id/trigger", (req, res) => {
  try {
    const { id } = req.params;
    const { usedAt, details = {} } = req.body;

    const result = HoneyTokenService.triggerAlert(id, usedAt, details);

    if (!result.success) {
      return res.status(404).json(result);
    }

    // In production, would:
    // 1. Update threat score for attacker
    // 2. Create incident ticket
    // 3. Send alerts to SOC team
    // 4. Block the attacker IP

    res.json({
      success: true,
      alert: result.alert,
      action_taken: "CRITICAL_ALERT_GENERATED",
      message: "Honeytoken usage detected! Incident created.",
    });
  } catch (err) {
    console.error("[honeytokels/:id/trigger] Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to trigger alert" });
  }
});

// GET /api/honeytokels/logs
// Get all honeytoken usage logs (forensics)
router.get("/logs", (req, res) => {
  try {
    const logs = HoneyTokenService.getUsageLog();

    res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (err) {
    console.error("[honeytokels/logs] Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch logs" });
  }
});

// DELETE /api/honeytokels/:id
// Deactivate a honeytoken
router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const success = HoneyTokenService.deactivateHoneytoken(id);

    if (!success) {
      return res
        .status(404)
        .json({ success: false, error: "Honeytoken not found" });
    }

    res.json({
      success: true,
      message: "Honeytoken deactivated",
    });
  } catch (err) {
    console.error("[honeytokels/:id DELETE] Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to deactivate honeytoken" });
  }
});

module.exports = router;
