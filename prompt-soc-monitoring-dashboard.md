# Prompt — soc-monitoring-dashboard

## Your Role
You are an expert Node.js + Express + React developer working on an existing cybersecurity project. Your first task before writing any code is to read every existing file in the project and list what each one contains. Only after fully understanding the codebase should you begin implementing features.

---

## What This Project Is
A SOC (Security Operations Centre) real-time monitoring dashboard. It reads attack data written by a separate honeypot project (`securebank-honeypot`) from a shared PostgreSQL database on Neon.tech, and displays it live to the security team. This is what the SOC team and the examiner watch during a demo.

**This project only reads from the database. It never writes attack data. Your job is soc-monitoring-dashboard only.**

---

## Tech Stack
- Frontend: React.js — SOC dashboard UI
- Backend: Node.js + Express.js — API server serving the dashboard
- Database: PostgreSQL on Neon.tech (shared — READ ONLY from this project)
- Real-time: Socket.io
- PDF: PDFKit (npm)

Do NOT add Docker or NGINX. Do NOT change the tech stack.

---

## Project Folder Structure
Work strictly within this existing structure. Do not reorganise it.

```
soc-monitoring-dashboard/
├── client/
│   └── src/
│       ├── App.jsx                        ← already built — main layout + polling
│       ├── index.css                      ← already built — dark theme CSS variables
│       ├── services/
│       │   └── api.js                     ← already built — all fetch() calls
│       └── components/
│           ├── StatsBar.jsx               ← already built
│           ├── LiveEventFeed.jsx          ← already built
│           ├── AttackerProfiles.jsx       ← already built (Block + PDF buttons wired)
│           ├── AttackTypeChart.jsx        ← already built (Recharts PieChart)
│           ├── TimelineChart.jsx          ← already built (Recharts AreaChart)
│           ├── ThreatGauge.jsx            ← already built (Recharts RadialBar)
│           ├── WorldMap.jsx               ← TO BUILD
│           ├── SessionTimeline.jsx        ← TO BUILD
│           └── HoneytokenPanel.jsx        ← TO BUILD
├── server/
│   ├── index.js                           ← already built
│   ├── db/
│   │   ├── pool.js                        ← already built (Neon.tech connection)
│   │   └── schema.sql                     ← full schema reference
│   ├── routes/
│   │   ├── events.js                      ← already built
│   │   ├── attackers.js                   ← already built
│   │   ├── stats.js                       ← already built
│   │   ├── report.js                      ← TO BUILD
│   │   ├── block.js                       ← TO BUILD
│   │   ├── honeytokens.js                 ← TO BUILD
│   │   └── sessions.js                    ← TO BUILD
│   ├── services/
│   │   └── threatScoring.js              ← TO BUILD
│   └── socket/
│       └── liveEvents.js                 ← TO BUILD
├── .env
└── package.json
```

---

## Database — Neon.tech PostgreSQL Connection

```javascript
// server/db/pool.js — already built, do not change
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
```

---

## Full Database Schema (reference — already on Neon.tech)

Tables this project reads from:

```
attack_logs            — all attack events from honeypot
attacker_profiles      — enriched per-IP attacker data
honeytokens            — fake credentials planted by honeypot
honeytoken_alerts      — fired when a honeytoken is triggered
session_recordings     — every HTTP request attacker made, in sequence
ioc_records            — indicators of compromise
users                  — fake bank customers (for report context)
comments               — stored XSS payloads (for report context)
```

### Key columns — use these exact names in all queries:

**attack_logs:**
```
id, timestamp, source_ip, source_port, method, path, payload,
attack_type        VARCHAR — 'sqli' | 'xss' | 'bruteforce' | 'traversal' | 'recon' | 'csrf' | 'idor'
sub_attack_type    VARCHAR — 'union_based' | 'reflected' | 'stored' | 'auth_bypass' | 'path_traversal'
severity           INTEGER 1–10
severity_label     VARCHAR — computed by DB: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
user_agent, tool_detected, os_fingerprint, session_id,
targeted_endpoint, attempted_username, attempted_account,
response_code, is_blocked
```

**attacker_profiles:**
```
ip (PK), first_seen, last_seen, total_requests, threat_score (0–100),
country, city, isp, os, tool, is_known_malicious,
sqli_count, xss_count, bruteforce_count, traversal_count, csrf_count, idor_count,
attempted_account_takeover, attempted_funds_transfer, attempted_privilege_escalation,
latitude, longitude, last_updated
```

Note: `latitude` and `longitude` are now available directly on `attacker_profiles` — use these for the world map. No geocoding needed.

---

## What Already Exists — Read These Before Writing Anything

### Already-built server routes:

**`GET /api/events`**
Returns rows from `attack_logs`, newest first. Supports query params: `?limit=50`, `?attack_type=sqli`, `?severity=CRITICAL` (maps severity_label). Returns `{ success: true, count, data: [...] }`.

**`GET /api/events/latest`**
Returns single most recent attack log row.

**`GET /api/attackers`**
Returns all rows from `attacker_profiles` ordered by `threat_score DESC`. Supports `?country=` and `?is_known_malicious=true`. Returns `{ success: true, count, data: [...] }`.

**`GET /api/attackers/:ip`**
Returns single attacker profile + their last 20 attack_logs events. Returns `{ success: true, profile, events }`.

**`GET /api/stats`**
Returns aggregated data for all charts in one call:
```json
{
  "totalEvents": 25,
  "recentActivity": 8,
  "threatScore": 74,
  "attackBreakdown": [{ "attack_type": "sqli", "count": "8" }],
  "severityBreakdown": [{ "severity_label": "CRITICAL", "count": "7" }],
  "timeline": [{ "hour": "2025-05-24T08:00:00Z", "count": "4" }],
  "topAttackers": [{ "source_ip": "185.220.101.45", "count": "18" }],
  "topCountries": [{ "country": "Germany", "count": "18" }]
}
```

### Already-built React components:

**Design system — use these CSS variables in all new components. Do not introduce new colour values:**
```css
--bg-base:       #080c10   /* page background */
--bg-card:       #0d1117   /* card background */
--border:        rgba(56,139,253,0.12)
--border-accent: rgba(56,139,253,0.3)
--text-primary:  #e6edf3
--text-secondary:#8b949e
--text-muted:    #484f58
--accent-blue:   #388bfd
--accent-cyan:   #39d353
--accent-red:    #f85149
--accent-orange: #db6d28
--accent-yellow: #e3b341
--accent-purple: #bc8cff
--severity-critical: #f85149
--severity-high:     #db6d28
--severity-medium:   #e3b341
--severity-low:      #39d353
--attack-sqli:       #bc8cff
--attack-xss:        #388bfd
--attack-bruteforce: #f85149
--attack-traversal:  #e3b341
--font-mono: 'JetBrains Mono', monospace
--font-ui:   'Syne', sans-serif
```

**Existing CSS classes to reuse:**
```
.soc-card         → card container (bg-card, padding 1.25rem 1.5rem)
.soc-card-title   → section heading (11px, uppercase, letter-spacing)
.soc-badge        → small count pill (blue)
.soc-table        → data table
.soc-table-scroll → scrollable table wrapper (max-height 320px)
.soc-pill         → severity badge
.soc-pill-CRITICAL / HIGH / MEDIUM / LOW
.soc-ip           → IP address text (accent-blue)
.soc-ts           → timestamp text (muted, small)
.soc-report-btn   → action button (transparent, bordered)
```

**`StatsBar`** — 6 stat cards: total events, last 10 min, critical count, threat score, unique IPs, top country.
**`LiveEventFeed`** — filterable attack log table with severity pills, filter tabs by attack_type.
**`AttackerProfiles`** — attacker table with threat score bar, all attack type counts, Block (⊘) and PDF (⬇) buttons already calling the API.
**`AttackTypeChart`** — Recharts PieChart donut coloured by attack type.
**`TimelineChart`** — Recharts AreaChart of attacks per hour.
**`ThreatGauge`** — Recharts RadialBarChart 0–100.

**`App.jsx`** currently:
- Fetches events, attackers, stats in parallel every 5 seconds
- Renders the grid: ThreatGauge | AttackTypeChart | TimelineChart / LiveEventFeed / AttackerProfiles
- Has `lastUpdated` state shown in header

---

## Feature 1 — Socket.io Real-Time Push

### Server: `server/socket/liveEvents.js`

Attach Socket.io to the Express HTTP server. Export a function `initSocket(httpServer)` called from `index.js`.

```javascript
// index.js change:
const http   = require('http');
const server = http.createServer(app);
initSocket(server);
server.listen(PORT);
```

Inside `liveEvents.js`:
- Track `lastAttackCheck` timestamp (starts at server start)
- Every 3 seconds: `SELECT * FROM attack_logs WHERE timestamp > $1 ORDER BY timestamp ASC` with lastAttackCheck
  - If rows found: emit `new_attack` to all clients with `{ events: rows }`
  - Update lastAttackCheck
- Every 10 seconds: run the same stats query as `/api/stats` and emit `stats_update`
- Every 5 seconds: `SELECT * FROM honeytoken_alerts WHERE triggered_at > $1` with lastCheck
  - If rows found: emit `honeytoken_triggered` with `{ ip, type, triggeredAt, severity: 'CRITICAL' }`

### Client: update `App.jsx`

Add alongside existing polling (keep polling as fallback):
```javascript
import { io } from 'socket.io-client';

// In useEffect:
const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');

socket.on('new_attack', ({ events }) => {
  setEvents(prev => [...events, ...prev].slice(0, 200)); // keep max 200
});

socket.on('stats_update', (newStats) => {
  setStats(newStats);
});

socket.on('honeytoken_triggered', (alert) => {
  setHoneytokenAlert(alert);          // show banner
  setTimeout(() => setHoneytokenAlert(null), 10000);  // auto-dismiss after 10s
});

return () => socket.disconnect();
```

Add `honeytokenAlert` state. When not null, show a full-width red banner below the header:
```jsx
{honeytokenAlert && (
  <div className="soc-honeytoken-banner">
    ⚠ HONEYTOKEN TRIGGERED — Attacker {honeytokenAlert.ip} reused fake credentials
    — {new Date(honeytokenAlert.triggeredAt).toLocaleTimeString()}
    <button onClick={() => setHoneytokenAlert(null)}>✕</button>
  </div>
)}
```

Add to `index.css`:
```css
.soc-honeytoken-banner {
  background: rgba(248,81,73,0.15);
  border-bottom: 1px solid rgba(248,81,73,0.4);
  color: var(--accent-red);
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 10px 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  animation: slideDown 0.3s ease;
}
@keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
```

---

## Feature 2 — PDF Report Generation

File: `server/routes/report.js`

`GET /api/report/:ip` — generate and stream a professional PDF.

Run these queries in parallel:
```javascript
const [profile, events, tokens, tokenAlerts] = await Promise.all([
  pool.query('SELECT * FROM attacker_profiles WHERE ip = $1', [ip]),
  pool.query('SELECT * FROM attack_logs WHERE source_ip = $1 ORDER BY timestamp DESC LIMIT 20', [ip]),
  pool.query('SELECT * FROM honeytokens WHERE attacker_ip = $1', [ip]),
  pool.query('SELECT * FROM honeytoken_alerts WHERE attacker_ip = $1', [ip]),
]);
```

Build PDF with PDFKit. Sections in order:

1. **Header** — "THREAT INTELLIGENCE REPORT" (large, bold), horizontal rule, "Classification: CONFIDENTIAL", generated timestamp

2. **Executive Summary** (box with light background)
   - IP Address, Country, City, ISP
   - First Seen / Last Seen
   - Total Requests
   - Overall Threat Level: CRITICAL / HIGH / MEDIUM / LOW (based on threat_score)

3. **Threat Score** — large number (e.g. "88 / 100"), threat level label, one-line description

4. **Attack Breakdown** — table:
   | Type | Count |
   | SQL Injection | 12 |
   | XSS | 7 |
   | Brute Force | 0 |
   | Dir Traversal | 2 |

5. **Attack Timeline** — last 20 events listed:
   `[timestamp]  METHOD  /path  severity_label  — payload snippet (80 chars max)`

6. **Indicators of Compromise**
   - Tools used, OS fingerprint
   - All unique paths accessed
   - All unique payloads (truncated)
   - Flags: attempted_account_takeover, attempted_funds_transfer, attempted_privilege_escalation

7. **Honeytoken Activity** — if any triggered:
   `Token ID, Type, Triggered At, Severity`

8. **Risk Assessment** — 2–3 paragraph written assessment based on attack types:
   - If sqli: mention data exfiltration risk, credential theft
   - If bruteforce: mention account takeover, credential stuffing
   - If traversal: mention filesystem exposure, config file theft
   - If xss: mention session hijacking, malware delivery

9. **Recommendations** — 5–6 bullet points appropriate to attack types detected:
   - sqli → "Implement parameterised queries and prepared statements"
   - xss → "Apply Content Security Policy headers, sanitise all output"
   - bruteforce → "Implement account lockout after 5 failed attempts, add MFA"
   - traversal → "Validate and whitelist all file paths, use chroot jails"

10. **Footer** — "Generated by SecureBank SOC Platform" + timestamp + page numbers

Set response headers:
```javascript
res.setHeader('Content-Type', 'application/pdf');
res.setHeader('Content-Disposition', `attachment; filename="threat-report-${ip}.pdf"`);
doc.pipe(res);
doc.end();
```

The ⬇ PDF button in `AttackerProfiles.jsx` already calls this route. Just build it and it works.

---

## Feature 3 — Block IP Route

File: `server/routes/block.js`

### `POST /api/block/:ip`
- Validate IPv4 format: `/^(\d{1,3}\.){3}\d{1,3}$/`
- Run iptables via child_process:
  ```javascript
  const { exec } = require('child_process');
  exec(`iptables -A INPUT -s ${ip} -j DROP`);
  exec(`iptables -A OUTPUT -d ${ip} -j DROP`);
  ```
- Return `{ success: true, ip, blockedAt: new Date().toISOString() }`
- If exec fails: return `{ success: false, error: 'Insufficient permissions — server must run as root' }`
- Wrap in try/catch — never crash

### `GET /api/block/status/:ip`
- `exec('iptables -L INPUT -n')` and check if ip appears in output
- Return `{ blocked: true/false, ip }`

The ⊘ Block button in `AttackerProfiles.jsx` already calls `POST /api/block/:ip`. Just build the route.

---

## Feature 4 — World Threat Map

File: `client/src/components/WorldMap.jsx`

Install: `npm install react-leaflet leaflet`

```javascript
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
```

- Dark tile layer URL: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
- Attribution: `&copy; OpenStreetMap contributors &copy; CARTO`
- Default center: `[20, 0]`, zoom: `2`
- Props: `attackers` array (already fetched in App.jsx, contains `latitude` and `longitude` directly)

For each attacker with valid lat/long:
```javascript
<CircleMarker
  center={[attacker.latitude, attacker.longitude]}
  radius={Math.min(6 + attacker.total_requests / 5, 20)}
  fillColor={threatColor(attacker.threat_score)}
  color={threatColor(attacker.threat_score)}
  fillOpacity={0.7}
  weight={1}
>
  <Popup>
    <div style={{ fontFamily: 'monospace', fontSize: '12px', minWidth: '180px' }}>
      <strong style={{ color: '#388bfd' }}>{attacker.ip}</strong><br/>
      {attacker.country} / {attacker.city}<br/>
      Score: {attacker.threat_score}/100<br/>
      Tool: {attacker.tool}<br/>
      Requests: {attacker.total_requests}
    </div>
  </Popup>
</CircleMarker>
```

Color function:
```javascript
function threatColor(score) {
  if (score >= 80) return '#f85149';   // CRITICAL — red
  if (score >= 60) return '#db6d28';   // HIGH — orange
  if (score >= 40) return '#e3b341';   // MEDIUM — yellow
  return '#39d353';                    // LOW — green
}
```

Add to `index.css`:
```css
.leaflet-container { background: #080c10 !important; height: 320px; width: 100%; border-radius: 8px; }
.leaflet-tile { filter: brightness(0.65) contrast(1.1) saturate(0.8); }
.leaflet-popup-content-wrapper { background: #0d1117; border: 1px solid rgba(56,139,253,0.3); border-radius: 6px; }
.leaflet-popup-content { color: #e6edf3; }
.leaflet-popup-tip { background: #0d1117; }
```

Add `WorldMap` to `App.jsx` grid as a full-width panel between the charts row and LiveEventFeed:
```jsx
<section className="soc-card" style={{ gridColumn: '1 / 4' }}>
  <h2 className="soc-card-title">World Threat Map</h2>
  <WorldMap attackers={attackers} />
</section>
```

---

## Feature 5 — Session Timeline UI

### Server: `server/routes/sessions.js`

`GET /api/sessions/ip/:ip`
```sql
SELECT session_id, attacker_ip, COUNT(*) as request_count,
  MIN(timestamp) as started_at, MAX(timestamp) as ended_at
FROM session_recordings WHERE attacker_ip = $1
GROUP BY session_id, attacker_ip ORDER BY started_at DESC
```

`GET /api/sessions/:id/timeline`
```sql
SELECT * FROM session_recordings WHERE session_id = $1 ORDER BY sequence_number ASC
```
Return with `timeSincePrevious` calculated in JS (difference from previous row's timestamp).

`GET /api/sessions/:id/forensics`
Return: session recording rows + attacker profile + detected attack types in the session.

### Client: `client/src/components/SessionTimeline.jsx`

A modal panel triggered by a "▶ Replay" button added to each attacker row in `AttackerProfiles.jsx`.

Props: `{ ip, onClose }`

On mount: fetch `GET /api/sessions/ip/${ip}`, then fetch `GET /api/sessions/${sessions[0].session_id}/timeline`.

Display as a vertical timeline:
```
Step  Time        Delta    Method   Path                Status   Attack
[1]   08:01:12    —        POST     /api/login          200      sqli (CRITICAL)
[2]   08:03:44    +2m32s   POST     /api/login          200      sqli (HIGH)
[3]   08:22:30    +18m46s  GET      /api/download       200      traversal (CRITICAL)
```

Colour each row's attack type using the existing attack type colour variables.
Show session summary at bottom: total steps, duration, attack types seen, payloads captured.

Modal styling — full-screen overlay, dark background, close button:
```css
.soc-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 200;
  display: flex; align-items: center; justify-content: center;
}
.soc-modal {
  background: var(--bg-card); border: 1px solid var(--border-accent);
  border-radius: 12px; width: 90%; max-width: 900px; max-height: 80vh;
  overflow-y: auto; padding: 1.5rem;
}
```

Add "▶ Replay" button to each row in `AttackerProfiles.jsx` (next to the existing PDF and Block buttons).

---

## Feature 6 — Honeytoken Panel

### Server: `server/routes/honeytokens.js`

`GET /api/honeytokens`
```sql
SELECT h.*, ha.triggered_at as alert_triggered_at, ha.details as alert_details
FROM honeytokens h
LEFT JOIN honeytoken_alerts ha ON h.id = ha.honeytoken_id
ORDER BY h.created_at DESC
```

`GET /api/honeytokens/triggered`
```sql
SELECT h.*, ha.triggered_at, ha.severity, ha.details
FROM honeytokens h
JOIN honeytoken_alerts ha ON h.id = ha.honeytoken_id
ORDER BY ha.triggered_at DESC
```

### Client: `client/src/components/HoneytokenPanel.jsx`

Props: `{ honeytokens }`

Show an alert banner at the top of the component if any tokens have `status = 'triggered'`:
```jsx
{triggered.length > 0 && (
  <div style={{ background:'rgba(248,81,73,0.1)', border:'1px solid rgba(248,81,73,0.3)',
    borderRadius:'6px', padding:'10px 14px', marginBottom:'1rem',
    fontFamily:'var(--font-mono)', fontSize:'12px', color:'var(--accent-red)' }}>
    🔴 {triggered.length} HONEYTOKEN{triggered.length > 1 ? 'S' : ''} TRIGGERED
  </div>
)}
```

Table columns: Type | Attacker IP | Created At | Status | Triggered At | Actions

Status badge:
- `active` → green pill: `{ background:'rgba(57,211,83,0.12)', color:'var(--accent-cyan)' }`
- `triggered` → red pill with pulse animation: `{ background:'rgba(248,81,73,0.15)', color:'var(--accent-red)', animation:'pulse 1.5s ease-in-out infinite' }`

```css
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
```

Triggered rows get a subtle red background: `rgba(248,81,73,0.04)`.

Add `HoneytokenPanel` to `App.jsx` grid below `AttackerProfiles`, passing `honeytokens` state (fetch from `/api/honeytokens` in the main `fetchAll` function).

---

## Feature 7 — Enhanced Threat Scoring Service

File: `server/services/threatScoring.js`

```javascript
function calculateThreatScore(profile, recentAttacks) {
  let score = 0;

  // 1. Severity factor (max 30 points)
  // recentAttacks is array of attack_log rows with severity INTEGER
  const severityPoints = recentAttacks.reduce((sum, a) => {
    if (a.severity >= 9) return sum + 4;      // CRITICAL
    if (a.severity >= 7) return sum + 3;      // HIGH
    if (a.severity >= 4) return sum + 2;      // MEDIUM
    return sum + 1;                            // LOW
  }, 0);
  score += Math.min(30, severityPoints);

  // 2. Attack type factor (max 20 points)
  const typePoints =
    (profile.sqli_count      * 4) +
    (profile.traversal_count * 3) +
    (profile.bruteforce_count* 3) +
    (profile.xss_count       * 2) +
    (profile.csrf_count      * 2) +
    (profile.idor_count      * 2);
  score += Math.min(20, typePoints);

  // 3. Persistence factor (max 30 points)
  const firstSeen  = new Date(profile.first_seen);
  const lastSeen   = new Date(profile.last_seen);
  const daysDiff   = (lastSeen - firstSeen) / (1000 * 60 * 60 * 24);
  if (daysDiff > 7)       score += 30;
  else if (daysDiff > 1)  score += 15;

  // 4. Velocity factor (max 10 points)
  const duration = Math.max(1, (lastSeen - firstSeen) / 60000); // minutes
  const reqPerMin = profile.total_requests / duration;
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
  return {
    total,
    level: total >= 80 ? 'CRITICAL' : total >= 60 ? 'HIGH' : total >= 40 ? 'MEDIUM' : 'LOW',
    breakdown: {
      severity:    Math.min(30, /* recalculate each factor */ 0),
      attackType:  Math.min(20, 0),
      persistence: 0,
      velocity:    0,
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
```

Integrate into `stats.js`: when building `topAttackers`, run each through `calculateThreatScore` using their recent attacks. Include the result as `calculatedThreatScore` alongside the raw DB `threat_score`.

---

## npm packages to install

```bash
# Server
npm install express pg cors dotenv socket.io pdfkit

# Client
npm install socket.io-client react-leaflet leaflet recharts axios
```

---

## Environment Variables (.env)

```
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
PORT=5000
REACT_APP_API_URL=http://localhost:5000
```

---

## Hard Rules — Read These Before Writing Any Code

1. Read every existing file first. List what each file contains before writing anything.
2. This project ONLY reads from the database. Never write to `attack_logs` or `attacker_profiles` from this project.
3. Match the existing dark theme exactly — use only the CSS variables already defined in `index.css`. Never hardcode colours.
4. Use JetBrains Mono for all data/table/code text. Use Syne for card headings. Both already loaded via Google Fonts.
5. All new components must use `.soc-card` and `.soc-card-title` classes for consistent styling.
6. All new server routes must return `{ success: true, data: [...] }` or `{ success: false, error: '...' }`.
7. All SQL must use parameterised queries: `pool.query(sql, [params])`. Never string-concatenate SQL.
8. Wrap every route handler in try/catch with a `res.status(500).json({ success: false, error: '...' })` fallback.
9. The ⬇ PDF button is already wired to `GET /api/report/:ip` in `AttackerProfiles.jsx` — just build the route.
10. The ⊘ Block button is already wired to `POST /api/block/:ip` in `AttackerProfiles.jsx` — just build the route.
11. Socket.io must run alongside polling — do not remove the existing 5-second polling from `App.jsx`.
12. The `severity_label` column is computed by the database — never insert it, only read it.
13. `latitude` and `longitude` are columns on `attacker_profiles` — use them directly for the world map.
14. Do NOT add Docker or NGINX.
15. Server runs on PORT 5000.
