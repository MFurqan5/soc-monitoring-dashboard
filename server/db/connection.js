// // In-memory mock database for development
// // This will be replaced with real PostgreSQL in production

// require("dotenv").config();

// // Mock data storage
// let attackLogs = [
//   {
//     id: 1,
//     timestamp: new Date(Date.now() - 3600000),
//     source_ip: "203.0.113.42",
//     source_port: 54231,
//     method: "POST",
//     path: "/login",
//     payload: "username=admin' OR '1'='1' -- &password=anything",
//     attack_type: "sqli",
//     severity: "CRITICAL",
//     user_agent: "sqlmap/1.4.9",
//     tool_detected: "sqlmap",
//     os_fingerprint: "Kali Linux",
//     session_id: "sess_001",
//     response_code: 200,
//   },
//   {
//     id: 2,
//     timestamp: new Date(Date.now() - 1800000),
//     source_ip: "198.51.100.73",
//     source_port: 45123,
//     method: "GET",
//     path: "/search?q=<script>alert('xss')</script>",
//     payload: "<script>alert('xss')</script>",
//     attack_type: "xss",
//     severity: "HIGH",
//     user_agent: "Mozilla/5.0",
//     tool_detected: "manual",
//     os_fingerprint: "Windows 10",
//     session_id: "sess_002",
//     response_code: 200,
//   },
// ];

// let attackerProfiles = [
//   {
//     ip: "203.0.113.42",
//     first_seen: new Date(Date.now() - 86400000),
//     last_seen: new Date(Date.now() - 3600000),
//     total_requests: 156,
//     threat_score: 95,
//     country: "CN",
//     city: "Beijing",
//     isp: "China Telecom",
//     os: "Kali Linux",
//     tool: "sqlmap",
//     is_known_malicious: true,
//     sqli_count: 45,
//     xss_count: 0,
//     bruteforce_count: 0,
//     traversal_count: 0,
//   },
//   {
//     ip: "198.51.100.73",
//     first_seen: new Date(Date.now() - 172800000),
//     last_seen: new Date(Date.now() - 1800000),
//     total_requests: 89,
//     threat_score: 72,
//     country: "RU",
//     city: "Moscow",
//     isp: "Rostelecom",
//     os: "Windows 10",
//     tool: "manual",
//     is_known_malicious: false,
//     sqli_count: 0,
//     xss_count: 23,
//     bruteforce_count: 0,
//     traversal_count: 0,
//   },
// ];

// // Mock query function that parses SQL and returns data
// function parseAndExecuteQuery(text, params = []) {
//   text = text.toLowerCase().trim();

//   // Handle WHERE ip = ? queries
//   if (text.includes("where ip")) {
//     const targetIp = params[0];
//     const result = attackerProfiles.find((p) => p.ip === targetIp);
//     if (text.includes("attack_logs")) {
//       // Get attack logs for this IP
//       const logs = attackLogs.filter((l) => l.source_ip === targetIp);
//       return { rows: logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) };
//     } else {
//       // Get attacker profile
//       return { rows: result ? [result] : [] };
//     }
//   }

//   if (text.includes("select") && text.includes("attack_logs")) {
//     // Return attack logs
//     let results = [...attackLogs];

//     if (text.includes("order by timestamp desc")) {
//       results = results.sort(
//         (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
//       );
//     }

//     if (text.includes("limit")) {
//       const limitMatch = text.match(/limit\s+\$?\d+/);
//       if (limitMatch) {
//         const limitNum = limitMatch[0].match(/\d+/)[0];
//         results = results.slice(0, parseInt(limitNum));
//       }
//     }

//     return { rows: results };
//   }

//   if (text.includes("select") && text.includes("attacker_profiles")) {
//     let results = [...attackerProfiles];

//     if (text.includes("order by threat_score desc")) {
//       results = results.sort((a, b) => b.threat_score - a.threat_score);
//     }

//     if (text.includes("limit")) {
//       const limitMatch = text.match(/limit\s+\$?\d+/);
//       if (limitMatch) {
//         const limitNum = limitMatch[0].match(/\d+/)[0];
//         results = results.slice(0, parseInt(limitNum));
//       }
//     }

//     return { rows: results };
//   }

//   // Handle COUNT(*) Total query for attack_logs
//   if (
//     text.includes("count(*)") &&
//     text.includes("from attack_logs") &&
//     !text.includes("group by")
//   ) {
//     return { rows: [{ total: String(attackLogs.length) }] };
//   }

//   // Handle COUNT per attack_type
//   if (
//     text.includes("count(*)") &&
//     text.includes("from attack_logs") &&
//     text.includes("group by attack_type")
//   ) {
//     const breakdown = {};
//     attackLogs.forEach((log) => {
//       breakdown[log.attack_type] = (breakdown[log.attack_type] || 0) + 1;
//     });
//     return {
//       rows: Object.entries(breakdown).map(([attack_type, count]) => ({
//         attack_type,
//         count: String(count),
//       })),
//     };
//   }

//   // Handle COUNT per severity
//   if (
//     text.includes("count(*)") &&
//     text.includes("from attack_logs") &&
//     text.includes("group by severity")
//   ) {
//     const breakdown = {};
//     attackLogs.forEach((log) => {
//       breakdown[log.severity] = (breakdown[log.severity] || 0) + 1;
//     });
//     return {
//       rows: Object.entries(breakdown).map(([severity, count]) => ({
//         severity,
//         count: String(count),
//       })),
//     };
//   }

//   // Handle COUNT per source_ip
//   if (
//     text.includes("count(*)") &&
//     text.includes("from attack_logs") &&
//     text.includes("group by source_ip")
//   ) {
//     const breakdown = {};
//     attackLogs.forEach((log) => {
//       breakdown[log.source_ip] = (breakdown[log.source_ip] || 0) + 1;
//     });
//     return {
//       rows: Object.entries(breakdown).map(([source_ip, count]) => ({
//         source_ip,
//         count: String(count),
//       })),
//     };
//   }

//   // Handle COUNT per country
//   if (
//     text.includes("count(*)") &&
//     text.includes("from attacker_profiles") &&
//     text.includes("group by country")
//   ) {
//     const breakdown = {};
//     attackerProfiles.forEach((profile) => {
//       if (profile.country) {
//         breakdown[profile.country] = (breakdown[profile.country] || 0) + 1;
//       }
//     });
//     return {
//       rows: Object.entries(breakdown)
//         .map(([country, count]) => ({ country, count: String(count) }))
//         .slice(0, 5),
//     };
//   }

//   // Handle recent activity (attacks in last 10 minutes)
//   if (text.includes("now() - interval '10 minutes'")) {
//     const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
//     const count = attackLogs.filter((log) => new Date(log.timestamp) > tenMinutesAgo)
//       .length;
//     return { rows: [{ count: String(count) }] };
//   }

//   // Handle timeline data (last 24 hours)
//   if (
//     text.includes("date_trunc('hour'")
//   ) {
//     return {
//       rows: [
//         {
//           hour: new Date(Date.now() - 86400000).toISOString(),
//           count: "15",
//         },
//         { hour: new Date(Date.now() - 3600000).toISOString(), count: "8" },
//         { hour: new Date().toISOString(), count: "2" },
//       ],
//     };
//   }

//   // Default empty result
//   return { rows: [] };
// }

// module.exports = {
//   query: (text, params) => {
//     return Promise.resolve(parseAndExecuteQuery(text, params));
//   },
// };


const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

module.exports = pool