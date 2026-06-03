const express = require("express");
const router = express.Router();
const SessionReplayService = require("../services/sessionReplay.service");

// POST /api/sessions/create
// Create a new session for an attacker
router.post("/create", (req, res) => {
  try {
    const { attackerIp } = req.body;

    if (!attackerIp) {
      return res
        .status(400)
        .json({ success: false, error: "attackerIp required" });
    }

    const session = SessionReplayService.createSession(attackerIp);

    res.json({
      success: true,
      session,
      message: "Session created - now recording all attacker actions",
    });
  } catch (err) {
    console.error("[sessions/create] Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to create session" });
  }
});

// POST /api/sessions/:sessionId/record
// Record an event in the session
router.post("/:sessionId/record", (req, res) => {
  try {
    const { sessionId } = req.params;
    const event = req.body;

    const result = SessionReplayService.recordEvent(sessionId, event);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({
      success: true,
      recording: result.recording,
    });
  } catch (err) {
    console.error("[sessions/:sessionId/record] Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to record event" });
  }
});

// POST /api/sessions/:sessionId/end
// End a session
router.post("/:sessionId/end", (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = SessionReplayService.endSession(sessionId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({
      success: true,
      session: result.session,
      message: "Session ended",
    });
  } catch (err) {
    console.error("[sessions/:sessionId/end] Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to end session" });
  }
});

// GET /api/sessions/:sessionId/replay
// Get full replay data for a session
router.get("/:sessionId/replay", (req, res) => {
  try {
    const { sessionId } = req.params;

    const replay = SessionReplayService.getSessionReplay(sessionId);

    if (!replay) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }

    res.json({
      success: true,
      replay,
    });
  } catch (err) {
    console.error("[sessions/:sessionId/replay] Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch replay" });
  }
});

// GET /api/sessions/:sessionId/timeline
// Get timeline visualization for a session
router.get("/:sessionId/timeline", (req, res) => {
  try {
    const { sessionId } = req.params;

    const timeline = SessionReplayService.getSessionTimeline(sessionId);

    if (!timeline) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }

    res.json({
      success: true,
      timeline,
    });
  } catch (err) {
    console.error("[sessions/:sessionId/timeline] Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch timeline" });
  }
});

// GET /api/sessions/:sessionId/forensics
// Export session as forensic report
router.get("/:sessionId/forensics", (req, res) => {
  try {
    const { sessionId } = req.params;

    const forensics = SessionReplayService.exportSessionForensics(sessionId);

    if (!forensics) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }

    res.json({
      success: true,
      forensics,
    });
  } catch (err) {
    console.error("[sessions/:sessionId/forensics] Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to export forensics" });
  }
});

// GET /api/sessions/ip/:attackerIp
// Get all sessions for an attacker IP
router.get("/ip/:attackerIp", (req, res) => {
  try {
    const { attackerIp } = req.params;

    const sessions = SessionReplayService.getAttackerSessions(attackerIp);

    res.json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (err) {
    console.error("[sessions/ip/:attackerIp] Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch sessions" });
  }
});

// GET /api/sessions
// Get all sessions
router.get("/", (req, res) => {
  try {
    const sessions = SessionReplayService.getAllSessions();

    res.json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (err) {
    console.error("[sessions] Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch sessions" });
  }
});

// DELETE /api/sessions/:sessionId
// Delete a session
router.delete("/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;

    const success = SessionReplayService.deleteSession(sessionId);

    if (!success) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }

    res.json({
      success: true,
      message: "Session deleted",
    });
  } catch (err) {
    console.error("[sessions/:sessionId DELETE] Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to delete session" });
  }
});

module.exports = router;
