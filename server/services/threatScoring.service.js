function calculateThreatScore(profile, recentAttacks) {
  let score = 0;

  // 1. Severity factor (max 30 points)
  // recentAttacks is array of attack_log rows with severity INTEGER
  const severityPoints = recentAttacks.reduce((sum, a) => {
    const sev = parseInt(a.severity);
    if (sev >= 9) return sum + 4;      // CRITICAL
    if (sev >= 7) return sum + 3;      // HIGH
    if (sev >= 4) return sum + 2;      // MEDIUM
    return sum + 1;                    // LOW
  }, 0);
  score += Math.min(30, severityPoints);

  // 2. Attack type factor (max 20 points)
  const typePoints =
    ((profile.sqli_count || 0)      * 4) +
    ((profile.traversal_count || 0) * 3) +
    ((profile.bruteforce_count || 0)* 3) +
    ((profile.xss_count || 0)       * 2) +
    ((profile.csrf_count || 0)      * 2) +
    ((profile.idor_count || 0)      * 2);
  score += Math.min(20, typePoints);

  // 3. Persistence factor (max 30 points)
  const firstSeen  = new Date(profile.first_seen);
  const lastSeen   = new Date(profile.last_seen);
  const daysDiff   = (lastSeen - firstSeen) / (1000 * 60 * 60 * 24);
  if (daysDiff > 7)       score += 30;
  else if (daysDiff > 1)  score += 15;

  // 4. Velocity factor (max 10 points)
  const duration = Math.max(1, (lastSeen - firstSeen) / 60000); // minutes
  const reqPerMin = (profile.total_requests || 0) / duration;
  if (reqPerMin > 5)      score += 10;
  else if (reqPerMin > 1) score += 5;
  else                    score += 2;

  // 5. Reputation factor (max 10 points)
  if (profile.is_known_malicious) score += 10;

  // Bonus flags
  if (profile.attempted_account_takeover)     score += 5;
  if (profile.attempted_funds_transfer)       score += 5;
  if (profile.attempted_privilege_escalation) score += 5;

  return Math.min(100, score);
}

function generateThreatScorecard(profile, attacks) {
  const total = calculateThreatScore(profile, attacks);

  // Recalculate each factor for detailed breakdown
  const severityPoints = attacks.reduce((sum, a) => {
    const sev = parseInt(a.severity);
    if (sev >= 9) return sum + 4;
    if (sev >= 7) return sum + 3;
    if (sev >= 4) return sum + 2;
    return sum + 1;
  }, 0);

  const typePoints =
    ((profile.sqli_count || 0)      * 4) +
    ((profile.traversal_count || 0) * 3) +
    ((profile.bruteforce_count || 0)* 3) +
    ((profile.xss_count || 0)       * 2) +
    ((profile.csrf_count || 0)      * 2) +
    ((profile.idor_count || 0)      * 2);

  const firstSeen = new Date(profile.first_seen);
  const lastSeen = new Date(profile.last_seen);
  const daysDiff = (lastSeen - firstSeen) / (1000 * 60 * 60 * 24);
  let persistencePoints = 0;
  if (daysDiff > 7) persistencePoints = 30;
  else if (daysDiff > 1) persistencePoints = 15;

  const duration = Math.max(1, (lastSeen - firstSeen) / 60000);
  const reqPerMin = (profile.total_requests || 0) / duration;
  let velocityPoints = 2;
  if (reqPerMin > 5) velocityPoints = 10;
  else if (reqPerMin > 1) velocityPoints = 5;

  return {
    total,
    level: total >= 80 ? 'CRITICAL' : total >= 60 ? 'HIGH' : total >= 40 ? 'MEDIUM' : 'LOW',
    breakdown: {
      severity:    Math.min(30, severityPoints),
      attackType:  Math.min(20, typePoints),
      persistence: persistencePoints,
      velocity:    velocityPoints,
      reputation:  profile.is_known_malicious ? 10 : 0,
    }
  };
}

function generateLeaderboard(profiles, attackMap) {
  return profiles
    .map(p => ({ ...p, calculatedScore: calculateThreatScore(p, attackMap[p.ip] || []) }))
    .sort((a, b) => b.calculatedScore - a.calculatedScore);
}

module.exports = { calculateThreatScore, generateThreatScorecard, generateLeaderboard };
