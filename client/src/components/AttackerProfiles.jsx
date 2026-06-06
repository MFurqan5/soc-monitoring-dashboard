// components/AttackerProfiles.jsx
import { useState } from "react";
import api from "../services/api";
import SessionTimeline from "./SessionTimeline";

export default function AttackerProfiles({ attackers }) {
  const [blockingIp, setBlockingIp] = useState(null);
  const [reportingIp, setReportingIp] = useState(null);
  const [blockedIps, setBlockedIps] = useState(new Set());
  const [notification, setNotification] = useState(null);
  const [replaySession, setReplaySession] = useState(null); // { sessionId, ip }

  const handleBlock = async (ip) => {
    setBlockingIp(ip);
    try {
      await api.blockIP(ip);
      setBlockedIps((prev) => new Set([...prev, ip]));
      showNotification(`${ip} blocked successfully`, "success");
    } catch {
      showNotification(`Failed to block ${ip}`, "error");
    } finally {
      setBlockingIp(null);
    }
  };

  const handleReport = async (ip) => {
    setReportingIp(ip);
    try {
      await api.downloadReport(ip);
      showNotification(`Report for ${ip} downloaded`, "success");
    } catch {
      showNotification(`Failed to generate report for ${ip}`, "error");
    } finally {
      setReportingIp(null);
    }
  };

  const handleReplay = async (ip) => {
    try {
      const result = await api.getAttackerSessions(ip);
      const sessions = result.sessions || [];
      if (sessions.length === 0) {
        showNotification(`No recorded sessions found for ${ip}`, "error");
        return;
      }
      // Open the most recent session
      const latest = sessions[0];
      setReplaySession({ sessionId: latest.sessionId, ip });
    } catch {
      showNotification(`Failed to load sessions for ${ip}`, "error");
    }
  };

  const showNotification = (msg, type) => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div>
      {/* Notification */}
      {notification && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "8px 14px",
            borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            background:
              notification.type === "success"
                ? "rgba(57,211,83,0.12)"
                : "rgba(248,81,73,0.12)",
            color:
              notification.type === "success"
                ? "var(--accent-cyan)"
                : "var(--accent-red)",
            border: `1px solid ${
              notification.type === "success"
                ? "rgba(57,211,83,0.3)"
                : "rgba(248,81,73,0.3)"
            }`,
          }}
        >
          {notification.msg}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <button
          onClick={async () => {
            try {
              await api.downloadProfilesReport();
            } catch (err) {
              alert("Error generating PDF: " + err.message);
            }
          }}
          className="soc-refresh-btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            borderColor: "var(--accent-blue)",
            color: "var(--accent-blue)",
            padding: "5px 12px",
            height: "28px",
            fontSize: "11px"
          }}
        >
          📄 Export All Profiles to PDF
        </button>
      </div>

      <div className="soc-table-scroll">
        <table className="soc-table">
          <thead>
            <tr>
              <th>IP Address</th>
              <th>Country / City</th>
              <th>ISP</th>
              <th>Tool</th>
              <th>Threat Score</th>
              <th>SQLi</th>
              <th>XSS</th>
              <th>Brute</th>
              <th>Traversal</th>
              <th>Status</th>
              <th>Last Seen</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {attackers.length === 0 ? (
              <tr>
                <td
                  colSpan={12}
                  style={{
                    textAlign: "center",
                    color: "var(--text-muted)",
                    padding: "2rem",
                  }}
                >
                  No attacker profiles found
                </td>
              </tr>
            ) : (
              attackers.map((a) => (
                <tr
                  key={a.ip}
                  style={{ opacity: blockedIps.has(a.ip) ? 0.45 : 1 }}
                >
                  {/* IP */}
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {a.is_known_malicious && (
                        <span
                          title="Known malicious"
                          style={{
                            color: "var(--accent-red)",
                            fontSize: "10px",
                          }}
                        >
                          ●
                        </span>
                      )}
                      <span className="soc-ip">{a.ip}</span>
                    </div>
                  </td>

                  {/* Location */}
                  <td>
                    <span style={{ color: "var(--text-primary)" }}>
                      {a.country ?? "—"}
                    </span>
                    {a.city && (
                      <span
                        style={{
                          color: "var(--text-muted)",
                          marginLeft: "4px",
                        }}
                      >
                        / {a.city}
                      </span>
                    )}
                  </td>

                  {/* ISP */}
                  <td
                    style={{
                      color: "var(--text-secondary)",
                      maxWidth: "160px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.isp ?? "—"}
                  </td>

                  {/* Tool */}
                  <td style={{ color: "var(--accent-yellow)" }}>
                    {a.tool ?? "—"}
                  </td>

                  {/* Threat Score */}
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          color: scoreColor(a.threat_score),
                          fontWeight: 600,
                          minWidth: "28px",
                        }}
                      >
                        {a.threat_score}
                      </span>
                      <div className="soc-score-bar-wrap">
                        <div
                          className="soc-score-bar"
                          style={{
                            width: `${a.threat_score}%`,
                            background: scoreColor(a.threat_score),
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Attack Counts */}
                  <td style={{ color: "var(--attack-sqli)" }}>
                    {a.sqli_count ?? 0}
                  </td>
                  <td style={{ color: "var(--attack-xss)" }}>
                    {a.xss_count ?? 0}
                  </td>
                  <td style={{ color: "var(--attack-bruteforce)" }}>
                    {a.bruteforce_count ?? 0}
                  </td>
                  <td style={{ color: "var(--attack-traversal)" }}>
                    {a.traversal_count ?? 0}
                  </td>

                  {/* Status */}
                  <td>
                    {blockedIps.has(a.ip) ? (
                      <span
                        className="soc-pill"
                        style={{
                          background: "rgba(248,81,73,0.15)",
                          color: "var(--accent-red)",
                        }}
                      >
                        BLOCKED
                      </span>
                    ) : a.is_known_malicious ? (
                      <span
                        className="soc-pill"
                        style={{
                          background: "rgba(219,109,40,0.15)",
                          color: "var(--accent-orange)",
                        }}
                      >
                        MALICIOUS
                      </span>
                    ) : (
                      <span
                        className="soc-pill"
                        style={{
                          background: "rgba(139,148,158,0.12)",
                          color: "var(--text-muted)",
                        }}
                      >
                        ACTIVE
                      </span>
                    )}
                  </td>

                  {/* Last Seen */}
                  <td className="soc-ts">{formatTime(a.last_seen)}</td>

                  {/* Actions */}
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        className="soc-report-btn"
                        onClick={() => handleReport(a.ip)}
                        disabled={reportingIp === a.ip}
                        title="Download PDF report"
                      >
                        {reportingIp === a.ip ? "..." : "⬇ PDF"}
                      </button>
                      <button
                        className="soc-report-btn"
                        onClick={() => handleBlock(a.ip)}
                        disabled={blockingIp === a.ip || blockedIps.has(a.ip)}
                        title="Block this IP"
                        style={{
                          color: blockedIps.has(a.ip)
                            ? "var(--text-muted)"
                            : "var(--accent-red)",
                          borderColor: blockedIps.has(a.ip)
                            ? "var(--border)"
                            : "rgba(248,81,73,0.3)",
                        }}
                      >
                        {blockingIp === a.ip
                          ? "..."
                          : blockedIps.has(a.ip)
                            ? "Blocked"
                            : "⊘ Block"}
                      </button>
                      <button
                        className="soc-report-btn"
                        onClick={() => handleReplay(a.ip)}
                        title="Replay session"
                        style={{ color: "#388bfd", borderColor: "rgba(56,139,253,0.3)" }}
                      >
                        ▶ Replay
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Session Timeline Modal */}
      {replaySession && (
        <SessionTimeline
          sessionId={replaySession.sessionId}
          attackerIp={replaySession.ip}
          onClose={() => setReplaySession(null)}
        />
      )}
    </div>
  );
}

function scoreColor(score) {
  if (score >= 80) return "var(--severity-critical)";
  if (score >= 60) return "var(--severity-high)";
  if (score >= 40) return "var(--severity-medium)";
  return "var(--severity-low)";
}

function formatTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return (
    d.toLocaleTimeString("en-GB", { hour12: false }) +
    " " +
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
  );
}
