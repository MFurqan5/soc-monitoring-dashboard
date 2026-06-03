// services/threatScoring.service.js
// Enhanced Threat Scoring - Calculate threat level with multiple factors

const THREAT_WEIGHTS = {
  severity: {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  },
  attackType: {
    sqli: 4, // SQLi is most dangerous
    bruteforce: 3,
    traversal: 3,
    xss: 2,
  },
  persistence: {
    firstTime: 0,
    returning: 15, // Attackers who come back = higher threat
    frequent: 30, // Regular attacker = much higher threat
  },
  velocity: {
    slow: 5, // < 1 req/second = tactical
    medium: 10, // 1-5 req/second = automated
    fast: 20, // > 5 req/second = aggressive
  },
  geography: {
    knownMalicious: 20, // Country/ISP known for attacks
    unusual: 10, // Unusual access pattern
    neutral: 0,
  },
};

class ThreatScoringService {
  /**
   * Calculate threat score based on multiple factors
   */
  static calculateThreatScore(attackerProfile, recentAttacks = []) {
    let score = 0;

    // 1. Severity-based scoring (30 points max)
    const severityScore = this.calculateSeverityScore(recentAttacks);
    score += severityScore;

    // 2. Attack type scoring (20 points max)
    const typeScore = this.calculateTypeScore(recentAttacks);
    score += typeScore;

    // 3. Persistence scoring (30 points max)
    const persistenceScore = this.calculatePersistenceScore(attackerProfile);
    score += persistenceScore;

    // 4. Velocity/Volume scoring (10 points max)
    const velocityScore = this.calculateVelocityScore(recentAttacks);
    score += velocityScore;

    // 5. Geography/Reputation (10 points max)
    const geoScore = this.calculateGeographyScore(attackerProfile);
    score += geoScore;

    // Cap at 100
    return Math.min(100, score);
  }

  /**
   * Calculate severity-based score
   */
  static calculateSeverityScore(attacks) {
    if (!attacks || attacks.length === 0) return 0;

    let score = 0;
    const recentCount = Math.min(attacks.length, 10);

    for (let i = 0; i < recentCount; i++) {
      const severity = attacks[i].severity || "LOW";
      score += THREAT_WEIGHTS.severity[severity] || 1;
    }

    // Average and weight (0-30)
    return Math.min(30, (score / recentCount) * 5);
  }

  /**
   * Calculate attack type score
   */
  static calculateTypeScore(attacks) {
    if (!attacks || attacks.length === 0) return 0;

    const typeCount = {};
    attacks.forEach((a) => {
      typeCount[a.attack_type] = (typeCount[a.attack_type] || 0) + 1;
    });

    let score = 0;
    for (const [type, count] of Object.entries(typeCount)) {
      const weight = THREAT_WEIGHTS.attackType[type] || 1;
      score += weight * Math.min(count, 5); // Cap per type at 5
    }

    return Math.min(20, score);
  }

  /**
   * Calculate persistence score
   * (Is this a returning attacker? How often do they come back?)
   */
  static calculatePersistenceScore(profile) {
    if (!profile) return 0;

    const firstSeen = new Date(profile.first_seen);
    const lastSeen = new Date(profile.last_seen);
    const daysBetween = (lastSeen - firstSeen) / (1000 * 60 * 60 * 24);

    // If first attack was recent = low persistence
    if (daysBetween < 1) return 0;

    // Multiple days = returning attacker
    if (daysBetween < 7) return THREAT_WEIGHTS.persistence.returning; // 15 points

    // Multiple weeks = persistent attacker
    if (daysBetween < 30) return THREAT_WEIGHTS.persistence.frequent; // 30 points

    // Multiple months = highly persistent threat
    return THREAT_WEIGHTS.persistence.frequent + 10;
  }

  /**
   * Calculate velocity score
   * (How many requests per minute? Aggressive attackers = higher score)
   */
  static calculateVelocityScore(attacks) {
    if (!attacks || attacks.length < 2) return 0;

    const firstAttack = new Date(attacks[attacks.length - 1].timestamp);
    const lastAttack = new Date(attacks[0].timestamp);
    const minutesBetween = (lastAttack - firstAttack) / (1000 * 60);

    if (minutesBetween === 0) return THREAT_WEIGHTS.velocity.fast; // All at once!

    const requestsPerMinute = attacks.length / minutesBetween;

    if (requestsPerMinute > 5) return THREAT_WEIGHTS.velocity.fast; // 20 points
    if (requestsPerMinute > 1) return THREAT_WEIGHTS.velocity.medium; // 10 points

    return THREAT_WEIGHTS.velocity.slow; // 5 points
  }

  /**
   * Calculate geography/reputation score
   */
  static calculateGeographyScore(profile) {
    let score = 0;

    if (!profile) return score;

    // Known malicious countries/regions
    const maliciousCountries = ["CN", "RU", "KP", "IR"];
    if (maliciousCountries.includes(profile.country)) {
      score += THREAT_WEIGHTS.geography.knownMalicious; // 20 points
    }

    // If already marked as known malicious
    if (profile.is_known_malicious) {
      score += THREAT_WEIGHTS.geography.knownMalicious; // 20 points
    }

    return Math.min(10, score);
  }

  /**
   * Get threat level label from score
   */
  static getThreatLevel(score) {
    if (score >= 80) return { level: "CRITICAL", color: "#ff0000" };
    if (score >= 60) return { level: "HIGH", color: "#ff9900" };
    if (score >= 40) return { level: "MEDIUM", color: "#ffcc00" };
    return { level: "LOW", color: "#00ff00" };
  }

  /**
   * Generate threat scorecard for an attacker
   */
  static generateThreatScorecard(attackerProfile, recentAttacks = []) {
    const totalScore = this.calculateThreatScore(attackerProfile, recentAttacks);
    const { level, color } = this.getThreatLevel(totalScore);

    const scorecard = {
      ip: attackerProfile.ip,
      threatScore: totalScore,
      threatLevel: level,
      threatColor: color,
      factors: {
        severity: this.calculateSeverityScore(recentAttacks),
        attackType: this.calculateTypeScore(recentAttacks),
        persistence: this.calculatePersistenceScore(attackerProfile),
        velocity: this.calculateVelocityScore(recentAttacks),
        geography: this.calculateGeographyScore(attackerProfile),
      },
      profile: {
        country: attackerProfile.country,
        isp: attackerProfile.isp,
        os: attackerProfile.os,
        tool: attackerProfile.tool,
        knownMalicious: attackerProfile.is_known_malicious,
      },
      attacks: {
        total: attackerProfile.total_requests || 0,
        recent: recentAttacks.length,
        bySeverity: this.countBySeverity(recentAttacks),
        byType: this.countByType(recentAttacks),
      },
      timeline: {
        firstSeen: attackerProfile.first_seen,
        lastSeen: attackerProfile.last_seen,
        daysSinceLast: this.daysSinceLast(attackerProfile.last_seen),
      },
      recommendation: this.getRecommendation(totalScore),
    };

    return scorecard;
  }

  /**
   * Get security recommendation based on threat score
   */
  static getRecommendation(score) {
    if (score >= 80) {
      return "IMMEDIATE ACTION: Block IP, escalate to SOC, investigate system breach";
    }
    if (score >= 60) {
      return "HIGH PRIORITY: Block IP, monitor for data exfiltration";
    }
    if (score >= 40) {
      return "MEDIUM PRIORITY: Rate limit, monitor closely";
    }
    return "LOW PRIORITY: Monitor and log";
  }

  /**
   * Helper: Count attacks by severity
   */
  static countBySeverity(attacks) {
    const counts = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };

    attacks.forEach((a) => {
      if (counts[a.severity] !== undefined) {
        counts[a.severity]++;
      }
    });

    return counts;
  }

  /**
   * Helper: Count attacks by type
   */
  static countByType(attacks) {
    const counts = {};

    attacks.forEach((a) => {
      counts[a.attack_type] = (counts[a.attack_type] || 0) + 1;
    });

    return counts;
  }

  /**
   * Helper: Calculate days since last attack
   */
  static daysSinceLast(lastSeen) {
    if (!lastSeen) return null;

    const lastDate = new Date(lastSeen);
    const now = new Date();
    const days = (now - lastDate) / (1000 * 60 * 60 * 24);

    return Math.floor(days);
  }

  /**
   * Generate attacker leaderboard (top threats)
   */
  static generateLeaderboard(allAttackers, recentAttacksByIp) {
    const leaderboard = allAttackers.map((attacker) => {
      const recentAttacks = recentAttacksByIp[attacker.ip] || [];
      const scorecard = this.generateThreatScorecard(attacker, recentAttacks);

      return {
        rank: 0, // Will be set after sorting
        ip: attacker.ip,
        threatScore: scorecard.threatScore,
        threatLevel: scorecard.threatLevel,
        country: attacker.country,
        totalAttacks: attacker.total_requests,
        tool: attacker.tool,
      };
    });

    // Sort by threat score descending
    leaderboard.sort((a, b) => b.threatScore - a.threatScore);

    // Add ranks
    leaderboard.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    return leaderboard;
  }
}

module.exports = ThreatScoringService;
