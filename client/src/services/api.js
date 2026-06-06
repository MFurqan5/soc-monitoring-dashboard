// services/api.js
// All API calls in one place — change BASE_URL to match your server

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

const api = {
  async getEvents({ limit = 50, attack_type, severity } = {}) {
    const params = new URLSearchParams({ limit });
    if (attack_type) params.append("attack_type", attack_type);
    if (severity) params.append("severity", severity);
    const res = await fetch(`${BASE_URL}/api/events?${params}`);
    if (!res.ok) throw new Error("Failed to fetch events");
    return res.json();
  },

  async getLatestEvent() {
    const res = await fetch(`${BASE_URL}/api/events/latest`);
    if (!res.ok) throw new Error("Failed to fetch latest event");
    return res.json();
  },

  async getAttackers({ country, is_known_malicious } = {}) {
    const params = new URLSearchParams();
    if (country) params.append("country", country);
    if (is_known_malicious !== undefined)
      params.append("is_known_malicious", is_known_malicious);
    const res = await fetch(`${BASE_URL}/api/attackers?${params}`);
    if (!res.ok) throw new Error("Failed to fetch attackers");
    return res.json();
  },

  async getAttackerProfile(ip) {
    const res = await fetch(
      `${BASE_URL}/api/attackers/${encodeURIComponent(ip)}`,
    );
    if (!res.ok) throw new Error("Failed to fetch attacker profile");
    return res.json();
  },

  async getStats() {
    const res = await fetch(`${BASE_URL}/api/stats`);
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
  },

  async downloadReport(ip) {
    const res = await fetch(`${BASE_URL}/api/report/${encodeURIComponent(ip)}`);
    if (!res.ok) throw new Error("Failed to generate report");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `threat-report-${ip}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  async downloadLogsReport() {
    const res = await fetch(`${BASE_URL}/api/report/logs`);
    if (!res.ok) throw new Error("Failed to generate logs report");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attack-logs-report.pdf";
    a.click();
    window.URL.revokeObjectURL(url);
  },

  async downloadProfilesReport() {
    const res = await fetch(`${BASE_URL}/api/report/profiles`);
    if (!res.ok) throw new Error("Failed to generate profiles report");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attacker-profiles-report.pdf";
    a.click();
    window.URL.revokeObjectURL(url);
  },


  async blockIP(ip) {
    const res = await fetch(`${BASE_URL}/api/block/${encodeURIComponent(ip)}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to block IP");
    return res.json();
  },

  async getHoneytokens() {
    const res = await fetch(`${BASE_URL}/api/honeytokens`);
    if (!res.ok) throw new Error("Failed to fetch honeytokens");
    return res.json();
  },

  async getAttackerSessions(ip) {
    const res = await fetch(`${BASE_URL}/api/sessions/ip/${encodeURIComponent(ip)}`);
    if (!res.ok) throw new Error("Failed to fetch attacker sessions");
    return res.json();
  },
};

export default api;
