// services/sessionReplay.service.js
// Session Replay - Record and replay every attacker action

const crypto = require("crypto");

// In-memory storage of sessions and their recordings
const sessions = new Map();
const recordings = new Map();

class SessionReplayService {
  /**
   * Create a new session for an attacker
   */
  static createSession(attackerIp) {
    const sessionId = `sess_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    const session = {
      sessionId,
      attackerIp,
      startTime: new Date(),
      endTime: null,
      status: "active",
      requestCount: 0,
      events: [],
    };

    sessions.set(sessionId, session);
    recordings.set(sessionId, []);

    return session;
  }

  /**
   * Record an HTTP event in a session
   */
  static recordEvent(sessionId, event) {
    const session = sessions.get(sessionId);
    if (!session) {
      return { success: false, error: "Session not found" };
    }

    const recording = {
      sequence: recordings.get(sessionId).length + 1,
      timestamp: new Date(),
      method: event.method || "GET",
      path: event.path || "/",
      statusCode: event.statusCode || 200,
      userAgent: event.userAgent || "unknown",
      payload: event.payload || null,
      responseTime: event.responseTime || 0,
      attackDetected: event.attackDetected || false,
      attackType: event.attackType || null,
    };

    recordings.get(sessionId).push(recording);
    session.requestCount++;

    return { success: true, recording };
  }

  /**
   * End a session (attacker leaves/session timeout)
   */
  static endSession(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) {
      return { success: false, error: "Session not found" };
    }

    session.endTime = new Date();
    session.status = "completed";
    session.duration = session.endTime - session.startTime;

    return {
      success: true,
      session: {
        ...session,
        recordingCount: recordings.get(sessionId).length,
      },
    };
  }

  /**
   * Get full replay for a session
   */
  static getSessionReplay(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const sessionRecordings = recordings.get(sessionId) || [];

    return {
      session: {
        sessionId: session.sessionId,
        attackerIp: session.attackerIp,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        requestCount: session.requestCount,
      },
      events: sessionRecordings,
      playback: {
        totalEvents: sessionRecordings.length,
        firstEventTime: sessionRecordings[0]?.timestamp,
        lastEventTime: sessionRecordings[sessionRecordings.length - 1]?.timestamp,
        attacksDetected: sessionRecordings.filter((e) => e.attackDetected).length,
      },
    };
  }

  /**
   * Get all sessions for an attacker IP
   */
  static getAttackerSessions(attackerIp) {
    const attackerSessions = Array.from(sessions.values()).filter(
      (s) => s.attackerIp === attackerIp
    );

    return attackerSessions.map((s) => ({
      ...s,
      recordingCount: recordings.get(s.sessionId).length,
    }));
  }

  /**
   * Generate timeline visualization data
   */
  static getSessionTimeline(sessionId) {
    const replay = this.getSessionReplay(sessionId);
    if (!replay) {
      return null;
    }

    const timeline = {
      sessionId,
      attackerIp: replay.session.attackerIp,
      duration: replay.session.duration,
      events: replay.events.map((event, idx) => ({
        sequence: idx + 1,
        timestamp: event.timestamp,
        type: event.attackType || "request",
        method: event.method,
        path: event.path,
        status: event.statusCode,
        duration: event.responseTime,
        isAttack: event.attackDetected,
        color: event.attackDetected ? "#ff0000" : "#00ff00",
      })),
      summary: {
        total: replay.events.length,
        successful: replay.events.filter((e) => e.statusCode < 400).length,
        failed: replay.events.filter((e) => e.statusCode >= 400).length,
        attacks: replay.events.filter((e) => e.attackDetected).length,
      },
    };

    return timeline;
  }

  /**
   * Export session as forensic data
   */
  static exportSessionForensics(sessionId) {
    const replay = this.getSessionReplay(sessionId);
    if (!replay) {
      return null;
    }

    const forensics = {
      report: {
        title: "Session Replay Forensic Report",
        sessionId: replay.session.sessionId,
        attackerIp: replay.session.attackerIp,
        generatedAt: new Date().toISOString(),
        sessionDuration: replay.session.duration,
      },
      timeline: replay.events.map((e) => ({
        time: e.timestamp,
        action: `${e.method} ${e.path}`,
        status: `${e.statusCode}`,
        malicious: e.attackDetected ? "YES" : "NO",
        type: e.attackType,
      })),
      statistics: {
        totalRequests: replay.events.length,
        attackAttempts: replay.events.filter((e) => e.attackDetected).length,
        uniquePaths: [...new Set(replay.events.map((e) => e.path))].length,
        httpMethods: [...new Set(replay.events.map((e) => e.method))],
      },
      payloads: replay.events
        .filter((e) => e.payload)
        .map((e) => ({
          time: e.timestamp,
          type: e.attackType,
          payload: e.payload,
        })),
    };

    return forensics;
  }

  /**
   * Get all sessions
   */
  static getAllSessions() {
    return Array.from(sessions.values()).map((s) => ({
      ...s,
      recordingCount: recordings.get(s.sessionId).length,
    }));
  }

  /**
   * Delete a session (cleanup)
   */
  static deleteSession(sessionId) {
    sessions.delete(sessionId);
    recordings.delete(sessionId);
    return true;
  }
}

module.exports = SessionReplayService;
