// services/honeytokens.service.js
// Deception Technology - Plant fake data to catch attackers

const crypto = require("crypto");

// In-memory storage of active honeytokens
const activeHoneytokens = new Map();
const honeytokenUsageLog = [];

class HoneyTokenService {
  /**
   * Create a fake credential or file
   * @param {string} type - 'credential', 'api_key', 'file', 'config'
   * @param {string} attackerIp - IP to associate honeytoken with
   * @returns {object} honeytoken with id and value
   */
  static createHoneytoken(type, attackerIp) {
    const id = crypto.randomUUID();
    
    let value;
    switch (type) {
      case "credential":
        value = {
          username: `admin_${crypto.randomBytes(4).toString("hex")}`,
          password: crypto.randomBytes(16).toString("hex"),
          email: `admin_${crypto.randomBytes(4).toString("hex")}@company.com`,
        };
        break;
      case "api_key":
        value = {
          key: `sk_live_${crypto.randomBytes(32).toString("hex")}`,
          secret: `sk_secret_${crypto.randomBytes(32).toString("hex")}`,
        };
        break;
      case "file":
        value = {
          filename: `secret_config_${crypto.randomBytes(4).toString("hex")}.txt`,
          content: `INTERNAL SECRET: DB_PASSWORD=password123\nAPI_KEY=${crypto.randomBytes(16).toString("hex")}\n`,
        };
        break;
      case "config":
        value = {
          database_url: `postgres://admin:${crypto.randomBytes(12).toString("hex")}@internal-db.local:5432/sensitive`,
          api_token: crypto.randomBytes(32).toString("hex"),
        };
        break;
      default:
        value = { fake: "data" };
    }

    const honeytoken = {
      id,
      type,
      value,
      createdAt: new Date(),
      attackerIp,
      status: "active",
      triggered: false,
      triggeredAt: null,
    };

    activeHoneytokens.set(id, honeytoken);
    return honeytoken;
  }

  /**
   * Get a honeytoken by ID
   */
  static getHoneytoken(id) {
    return activeHoneytokens.get(id);
  }

  /**
   * Trigger alert when honeytoken is used
   * This would be called when:
   * - Attacker tries to use the fake credentials
   * - Fake API key appears in logs
   * - Someone accesses the trap file
   */
  static triggerAlert(honeytokenId, usedAt, details = {}) {
    const honeytoken = activeHoneytokens.get(honeytokenId);
    if (!honeytoken) {
      return { success: false, error: "Honeytoken not found" };
    }

    const alert = {
      honeytokenId,
      type: honeytoken.type,
      attackerIp: honeytoken.attackerIp,
      triggeredAt: usedAt || new Date(),
      severity: "CRITICAL",
      message: `Honeytoken ${honeytoken.type} was used/detected!`,
      details,
      evidence: {
        honeytokenCreatedAt: honeytoken.createdAt,
        timeToTrigger: new Date() - honeytoken.createdAt,
      },
    };

    honeytoken.triggered = true;
    honeytoken.triggeredAt = new Date();
    honeytoken.status = "triggered";

    honeytokenUsageLog.push(alert);

    // Escalate threat score for this attacker
    // (would be done via database update in production)

    return { success: true, alert };
  }

  /**
   * Get all active honeytokens
   */
  static getAllHoneytokens() {
    return Array.from(activeHoneytokens.values());
  }

  /**
   * Get triggered honeytokens (evidence of attacker using them)
   */
  static getTriggeredHoneytokens() {
    return Array.from(activeHoneytokens.values()).filter((h) => h.triggered);
  }

  /**
   * Get honeytoken usage log (for forensics)
   */
  static getUsageLog() {
    return honeytokenUsageLog;
  }

  /**
   * Deactivate a honeytoken (stop monitoring)
   */
  static deactivateHoneytoken(id) {
    const honeytoken = activeHoneytokens.get(id);
    if (honeytoken) {
      honeytoken.status = "inactive";
      return true;
    }
    return false;
  }

  /**
   * Generate fake response with honeytokens mixed in
   * Call this when attacker successfully exploits SQLi/XSS
   * Returns data with honeytokens embedded
   */
  static generateHoneypotResponse(type = "credentials") {
    const honeytokens = [];
    
    // Create 2-3 fake records/credentials
    for (let i = 0; i < Math.random() > 0.5 ? 2 : 3; i++) {
      honeytokens.push(this.createHoneytoken(type, "attacker_ip_placeholder"));
    }

    // Return realistic but fake data
    switch (type) {
      case "credentials":
        return {
          status: "success",
          users: honeytokens.map((h) => ({
            id: Math.floor(Math.random() * 10000),
            username: h.value.username,
            email: h.value.email,
            role: "admin",
            created_at: new Date(Date.now() - Math.random() * 86400000 * 30),
          })),
        };

      case "api_key":
        return {
          status: "success",
          keys: honeytokels.map((h) => ({
            id: Math.floor(Math.random() * 10000),
            name: `API Key ${Math.floor(Math.random() * 100)}`,
            key: h.value.key,
            secret: h.value.secret,
            created_at: new Date(Date.now() - Math.random() * 86400000 * 30),
          })),
        };

      default:
        return { status: "success", data: honeytokens };
    }
  }

  /**
   * Check if a value appears to be a honeytoken
   * Used when processing logs to detect if attacker used our fake data
   */
  static checkIfHoneytoken(value) {
    // Search through all honeytokels
    for (const honeytoken of activeHoneytokens.values()) {
      const tokenString = JSON.stringify(honeytoken.value);
      if (tokenString.includes(value)) {
        return honeytoken;
      }
    }
    return null;
  }
}

module.exports = HoneyTokenService;
