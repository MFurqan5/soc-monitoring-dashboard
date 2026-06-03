# Quick Reference - SOC Honeypot API Guide

## 🚀 Quick Start

```bash
# Start server
npm start

# Server runs on: http://localhost:5000
```

---

## 📊 Main Features At A Glance

| Feature | Purpose | Endpoint | Status |
|---------|---------|----------|--------|
| **Events** | View attack logs | GET /api/events | ✅ |
| **Attackers** | List threats | GET /api/attackers | ✅ |
| **Threat Score** | Calculate risk (0-100) | GET /api/stats | ✅ |
| **Reports** | Generate PDF | GET /api/report/:ip | ✅ |
| **Block IP** | Firewall integration | POST /api/block/:ip | ✅ |
| **Honeytokels** | Deception traps | POST /api/honeytokels/create | ✅ |
| **Session Replay** | Forensics | GET /api/sessions/:id/replay | ✅ |
| **Threat Scoring** | Multi-factor analysis | ThreatScoringService | ✅ |

---

## 🔥 Honeytokels (Deception Technology)

### Create Fake Credential
```bash
curl -X POST http://localhost:5000/api/honeytokels/create \
  -H "Content-Type: application/json" \
  -d '{
    "type":"credential",
    "attackerIp":"203.0.113.42"
  }'

# Response: fake username + password + email
```

### Types Available
- `credential` - Fake username/password
- `api_key` - Fake API key/secret
- `file` - Fake config file
- `config` - Fake database URL

### List All Honeytokels
```bash
curl http://localhost:5000/api/honeytokels
```

### Trigger Alert (When honeytoken is used)
```bash
curl -X POST http://localhost:5000/api/honeytokels/{id}/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "usedAt":"2026-06-03T15:30:00Z",
    "details":{"location":"attempted_ssh_login"}
  }'

# Response: CRITICAL alert with evidence
```

---

## 🎬 Session Replay (Forensics)

### Create Session
```bash
curl -X POST http://localhost:5000/api/sessions/create \
  -H "Content-Type: application/json" \
  -d '{"attackerIp":"203.0.113.42"}'

# Returns: sessionId
```

### Record Attacker Action
```bash
curl -X POST http://localhost:5000/api/sessions/{sessionId}/record \
  -H "Content-Type: application/json" \
  -d '{
    "method":"POST",
    "path":"/login",
    "statusCode":200,
    "attackDetected":true,
    "attackType":"sqli",
    "payload":"admin'\'' OR 1=1 --"
  }'
```

### Get Timeline of All Actions
```bash
curl http://localhost:5000/api/sessions/{sessionId}/timeline

# Returns: sequence of requests with timings
# Shows exactly how attacker progressed through system
```

### Export Forensic Report
```bash
curl http://localhost:5000/api/sessions/{sessionId}/forensics

# Returns: forensic data with all payloads, statistics, IOCs
```

### Get Full Replay Data
```bash
curl http://localhost:5000/api/sessions/{sessionId}/replay
```

---

## 📋 Threat Scoring (Multi-Factor)

### Threat Score Calculation
```
Total Score = Severity + Type + Persistence + Velocity + Geography
            = (0-30) + (0-20) + (0-30) + (0-10) + (0-10)
            = 0-100

Levels:
- 80-100: CRITICAL (🔴 Red)
- 60-79:  HIGH (🟠 Orange)
- 40-59:  MEDIUM (🟡 Yellow)
- 0-39:   LOW (🟢 Green)
```

### Factors Explained
1. **Severity** - Type of attacks (CRITICAL > HIGH > MEDIUM > LOW)
2. **Attack Type** - SQLi is most dangerous (4pts), XSS less (2pts)
3. **Persistence** - Returning attacker = +15-30 points
4. **Velocity** - How fast they attack (>5 req/sec = 20 pts)
5. **Geography** - Known malicious country/ISP = +20 pts

---

## 🔐 IP Blocking

### Block an Attacker IP
```bash
curl -X POST http://localhost:5000/api/block/203.0.113.42

# Response: Firewall rule ID
# Production: Updates iptables/WAF
```

### Check Block Status
```bash
curl http://localhost:5000/api/block/status/203.0.113.42

# Returns: is_blocked true/false
```

### List Blocked IPs
```bash
curl http://localhost:5000/api/block
```

---

## 📄 CERT Report Generation

### Generate Professional PDF
```bash
curl http://localhost:5000/api/report/203.0.113.42 -o threat-report.pdf

# Downloads: 4KB professional PDF with:
# - Executive summary
# - Attacker profile
# - Attack timeline
# - Indicators of Compromise (IOCs)
# - Risk assessment
# - Recommendations
```

---

## 👀 View Attack Events

### Get All Events
```bash
curl http://localhost:5000/api/events

# Returns: Latest attack logs newest first
```

### Get Latest Single Event
```bash
curl http://localhost:5000/api/events/latest
```

### Filter by Attack Type
```bash
curl "http://localhost:5000/api/events?attack_type=sqli"

# Types: sqli, xss, bruteforce, traversal
```

### Filter by Severity
```bash
curl "http://localhost:5000/api/events?severity=CRITICAL"

# Levels: CRITICAL, HIGH, MEDIUM, LOW
```

---

## 🎯 View Attackers

### List All Attackers
```bash
curl http://localhost:5000/api/attackers

# Sorted by threat score (highest first)
```

### Get Single Attacker Details
```bash
curl http://localhost:5000/api/attackers/203.0.113.42

# Returns: Profile + their 20 latest attacks
```

### Filter by Country
```bash
curl "http://localhost:5000/api/attackers?country=CN"
```

### Filter by Known Malicious
```bash
curl "http://localhost:5000/api/attackers?is_known_malicious=true"
```

---

## 📊 Statistics & Dashboard

### Get All Stats
```bash
curl http://localhost:5000/api/stats

# Returns:
# - totalEvents
# - recentActivity (last 10 mins)
# - threatScore (0-100)
# - attackBreakdown (by type)
# - severityBreakdown (by level)
# - topAttackers (most active IPs)
# - topCountries (geographic distribution)
```

---

## 🔌 Integration Points

### Connect to Real Database
File: `server/db/connection.js`

Replace mock implementation with:
```javascript
const { Pool } = require("pg");
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});
```

### Connect to SIEM
Add webhook endpoint for real-time alerts:
```javascript
// Send to Splunk/ELK/Wazuh
axios.post(SIEM_WEBHOOK_URL, threatAlert);
```

### Email Alerts
```javascript
// Send critical alerts to SOC team
if (threatScore > 80) {
  sendEmail(SOC_TEAM, 'CRITICAL THREAT', threatReport);
}
```

---

## 🧪 Complete Test Scenario

```bash
# 1. Create session
SESSION=$(curl -X POST http://localhost:5000/api/sessions/create \
  -H "Content-Type: application/json" \
  -d '{"attackerIp":"203.0.113.42"}' | jq -r '.session.sessionId')

# 2. Record attack
curl -X POST http://localhost:5000/api/sessions/$SESSION/record \
  -H "Content-Type: application/json" \
  -d '{"method":"POST","path":"/login","statusCode":200,"attackType":"sqli"}'

# 3. Create honeytoken
HONEY=$(curl -X POST http://localhost:5000/api/honeytokels/create \
  -H "Content-Type: application/json" \
  -d '{"type":"credential","attackerIp":"203.0.113.42"}' \
  | jq -r '.honeytoken.id')

# 4. Block the IP
curl -X POST http://localhost:5000/api/block/203.0.113.42

# 5. Generate report
curl http://localhost:5000/api/report/203.0.113.42 -o report.pdf

# 6. Get replay
curl http://localhost:5000/api/sessions/$SESSION/replay | jq

# 7. Check stats
curl http://localhost:5000/api/stats | jq '.data.threatScore'
```

---

## 🎓 What This Demonstrates

✅ Real-time threat detection
✅ Deception technology (honeypots)
✅ Forensic analysis capability
✅ Professional incident response
✅ Multi-factor threat assessment
✅ CERT report generation
✅ Enterprise-grade monitoring
✅ Legal evidence collection

---

## 📖 Documentation Files

- `README_IMPLEMENTATION_COMPLETE.md` - Full project summary
- `HONEYPOT_FEATURES_COMPLETE.md` - Feature details
- `IMPLEMENTATION_STATUS.md` - Current status
- `FEATURES_ANALYSIS.md` - Requirements analysis

---

## 🚨 Remember

This is a **deception-based honeypot system**. It:
- ✅ Traps attackers with fake data
- ✅ Records all their actions
- ✅ Generates professional reports
- ✅ Does NOT damage production systems
- ✅ Is completely legal to operate
- ✅ Matches enterprise SIEM capabilities

**Perfect for SOC demonstrations and security research!**

