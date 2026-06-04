// Mock in-memory database for development/demo when PostgreSQL is unavailable
// Provides realistic test data that mimics the real schema

const mockDb = {
  attack_logs: [
    {
      id: 1, timestamp: new Date(Date.now() - 3600000).toISOString(), source_ip: '185.220.101.45', source_port: 54321,
      method: 'POST', path: '/api/login', payload: "username=admin'--&password=anything", attack_type: 'sqli',
      severity: 9, severity_label: 'CRITICAL', user_agent: 'sqlmap/1.7.8', tool_detected: 'sqlmap',
      os_fingerprint: 'Linux x86_64', session_id: 'sess_a1b2c3', response_code: 200, is_blocked: false
    },
    {
      id: 2, timestamp: new Date(Date.now() - 3500000).toISOString(), source_ip: '185.220.101.45', source_port: 54322,
      method: 'POST', path: '/api/login', payload: "username='' OR 1=1--&password=test", attack_type: 'sqli',
      severity: 9, severity_label: 'CRITICAL', user_agent: 'sqlmap/1.7.8', tool_detected: 'sqlmap',
      os_fingerprint: 'Linux x86_64', session_id: 'sess_a1b2c3', response_code: 200, is_blocked: false
    },
    {
      id: 3, timestamp: new Date(Date.now() - 2900000).toISOString(), source_ip: '91.108.4.77', source_port: 61200,
      method: 'GET', path: '/api/search', payload: 'q=<script>alert(document.cookie)</script>', attack_type: 'xss',
      severity: 7, severity_label: 'HIGH', user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', tool_detected: 'manual',
      os_fingerprint: 'Windows 10', session_id: 'sess_d4e5f6', response_code: 200, is_blocked: false
    },
    {
      id: 4, timestamp: new Date(Date.now() - 2700000).toISOString(), source_ip: '45.155.205.10', source_port: 49800,
      method: 'POST', path: '/api/login', payload: 'username=admin&password=admin', attack_type: 'bruteforce',
      severity: 5, severity_label: 'MEDIUM', user_agent: 'python-requests/2.31.0', tool_detected: 'custom_script',
      os_fingerprint: 'Linux x86_64', session_id: 'sess_g7h8i9', response_code: 401, is_blocked: false
    },
    {
      id: 5, timestamp: new Date(Date.now() - 1500000).toISOString(), source_ip: '194.165.16.80', source_port: 55100,
      method: 'GET', path: '/api/download', payload: 'file=../../../../etc/passwd', attack_type: 'traversal',
      severity: 9, severity_label: 'CRITICAL', user_agent: 'curl/7.68.0', tool_detected: 'curl',
      os_fingerprint: 'Linux x86_64', session_id: 'sess_j1k2l3', response_code: 200, is_blocked: false
    },
  ],
  attacker_profiles: [
    {
      ip: '185.220.101.45', first_seen: new Date(Date.now() - 86400000).toISOString(), last_seen: new Date(Date.now() - 1800000).toISOString(),
      total_requests: 45, threat_score: 95, country: 'China', city: 'Beijing', isp: 'China Telecom', os: 'Kali Linux',
      tool: 'sqlmap', is_known_malicious: true, sqli_count: 45, xss_count: 0, bruteforce_count: 0, traversal_count: 0,
      csrf_count: 0, idor_count: 0, attempted_account_takeover: true, attempted_funds_transfer: false,
      attempted_privilege_escalation: false, latitude: 39.9042, longitude: 116.4074, last_updated: new Date().toISOString()
    },
    {
      ip: '91.108.4.77', first_seen: new Date(Date.now() - 172800000).toISOString(), last_seen: new Date(Date.now() - 900000).toISOString(),
      total_requests: 23, threat_score: 72, country: 'Russia', city: 'Moscow', isp: 'Rostelecom', os: 'Windows 10',
      tool: 'manual', is_known_malicious: false, sqli_count: 0, xss_count: 23, bruteforce_count: 0, traversal_count: 0,
      csrf_count: 0, idor_count: 0, attempted_account_takeover: false, attempted_funds_transfer: false,
      attempted_privilege_escalation: false, latitude: 55.7558, longitude: 37.6173, last_updated: new Date().toISOString()
    },
    {
      ip: '45.155.205.10', first_seen: new Date(Date.now() - 259200000).toISOString(), last_seen: new Date(Date.now() - 600000).toISOString(),
      total_requests: 78, threat_score: 58, country: 'United States', city: 'San Francisco', isp: 'AS16509', os: 'Ubuntu Linux',
      tool: 'Burp Suite', is_known_malicious: false, sqli_count: 8, xss_count: 12, bruteforce_count: 58, traversal_count: 0,
      csrf_count: 0, idor_count: 0, attempted_account_takeover: true, attempted_funds_transfer: false,
      attempted_privilege_escalation: false, latitude: 37.7749, longitude: -122.4194, last_updated: new Date().toISOString()
    },
    {
      ip: '194.165.16.80', first_seen: new Date(Date.now() - 345600000).toISOString(), last_seen: new Date(Date.now() - 300000).toISOString(),
      total_requests: 156, threat_score: 88, country: 'Brazil', city: 'São Paulo', isp: 'Vivo', os: 'Linux x86_64',
      tool: 'Custom Script', is_known_malicious: true, sqli_count: 12, xss_count: 34, bruteforce_count: 78, traversal_count: 32,
      csrf_count: 0, idor_count: 0, attempted_account_takeover: true, attempted_funds_transfer: true,
      attempted_privilege_escalation: true, latitude: -23.5505, longitude: -46.6333, last_updated: new Date().toISOString()
    },
  ],
  honeytokels: [
    {
      id: 'ht_001', type: 'credential', value: { username: 'admin_backup', password: 'SuperSecure123!' },
      attacker_ip: '185.220.101.45', created_at: new Date(Date.now() - 172800000).toISOString(), triggered_at: null
    },
    {
      id: 'ht_002', type: 'api_key', value: { key: 'sk_live_8f3k9d8fjk39dlsk' },
      attacker_ip: '91.108.4.77', created_at: new Date(Date.now() - 86400000).toISOString(),
      triggered_at: new Date(Date.now() - 60000).toISOString()
    },
  ],
  honeytoken_alerts: [
    {
      id: 'hta_001', honeytoken_id: 'ht_002', attacker_ip: '91.108.4.77',
      triggered_at: new Date(Date.now() - 60000).toISOString(), severity: 'CRITICAL', details: { endpoint: '/api/transfer' }
    },
  ],
  session_recordings: [
    {
      id: 1, session_id: 'sess_a1b2c3', attacker_ip: '185.220.101.45', sequence_number: 1,
      timestamp: new Date(Date.now() - 3600000).toISOString(), request_method: 'POST',
      request_path: '/api/login', request_body: "username=admin'--", response_code: 200
    },
  ],
};

// Simulate pg.Pool interface with mock data
class MockPool {
  async query(sql, params = []) {
    // Simple mock - just returns relevant mock data based on table name
    if (sql.includes('SELECT * FROM attack_logs')) {
      return { rows: mockDb.attack_logs, command: 'SELECT' };
    }
    if (sql.includes('SELECT * FROM attacker_profiles')) {
      return { rows: mockDb.attacker_profiles, command: 'SELECT' };
    }
    if (sql.includes('COUNT(*) AS total FROM attack_logs')) {
      return { rows: [{ total: mockDb.attack_logs.length }], command: 'SELECT' };
    }
    if (sql.includes('attack_type')) {
      const grouped = {};
      mockDb.attack_logs.forEach(log => {
        grouped[log.attack_type] = (grouped[log.attack_type] || 0) + 1;
      });
      return { rows: Object.entries(grouped).map(([k, v]) => ({ attack_type: k, count: v })), command: 'SELECT' };
    }
    if (sql.includes('severity')) {
      const grouped = {};
      mockDb.attack_logs.forEach(log => {
        grouped[log.severity_label] = (grouped[log.severity_label] || 0) + 1;
      });
      return { rows: Object.entries(grouped).map(([k, v]) => ({ severity: k, count: v })), command: 'SELECT' };
    }
    if (sql.includes('source_ip, COUNT(*)')) {
      const grouped = {};
      mockDb.attack_logs.forEach(log => {
        grouped[log.source_ip] = (grouped[log.source_ip] || 0) + 1;
      });
      return { rows: Object.entries(grouped).map(([ip, count]) => ({ source_ip: ip, count })).sort((a, b) => b.count - a.count).slice(0, 5), command: 'SELECT' };
    }
    if (sql.includes('country') && sql.includes('attacker_profiles')) {
      const grouped = {};
      mockDb.attacker_profiles.forEach(p => {
        if (p.country) grouped[p.country] = (grouped[p.country] || 0) + 1;
      });
      return { rows: Object.entries(grouped).map(([c, count]) => ({ country: c, count })).sort((a, b) => b.count - a.count).slice(0, 5), command: 'SELECT' };
    }
    if (sql.includes('honeytokels') || sql.includes('honeytokens')) {
      return { rows: mockDb.honeytokels, command: 'SELECT' };
    }
    if (sql.includes('honeytoken_alerts')) {
      return { rows: mockDb.honeytoken_alerts, command: 'SELECT' };
    }
    if (sql.includes('session_recordings')) {
      return { rows: mockDb.session_recordings, command: 'SELECT' };
    }
    if (sql.includes('WHERE source_ip = $1')) {
      const ip = params[0];
      const logs = mockDb.attack_logs.filter(l => l.source_ip === ip);
      return { rows: logs, command: 'SELECT' };
    }
    if (sql.includes('WHERE ip = $1')) {
      const ip = params[0];
      const profile = mockDb.attacker_profiles.find(p => p.ip === ip);
      return { rows: profile ? [profile] : [], command: 'SELECT' };
    }
    // Default
    return { rows: [], command: 'SELECT' };
  }
}

module.exports = new MockPool();
