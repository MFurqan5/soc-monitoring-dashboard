// components/LiveEventFeed.jsx
import { useState } from "react";

const ATTACK_LABELS = {
  sqli: "SQL Injection",
  xss: "XSS",
  bruteforce: "Brute Force",
  traversal: "Dir Traversal",
};

export default function LiveEventFeed({ events }) {
  const [filter, setFilter] = useState("all");

  const filtered =
    filter === "all" ? events : events.filter((e) => e.attack_type === filter);

  return (
    <div>
      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        {["all", "sqli", "xss", "bruteforce", "traversal"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            style={{
              background:
                filter === type ? "rgba(56,139,253,0.15)" : "transparent",
              border: `1px solid ${filter === type ? "var(--accent-blue)" : "var(--border)"}`,
              color:
                filter === type ? "var(--accent-blue)" : "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              padding: "4px 12px",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {type === "all" ? "ALL" : ATTACK_LABELS[type]}
          </button>
        ))}
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--text-muted)",
            alignSelf: "center",
          }}
        >
          {filtered.length} events
        </span>
      </div>

      {/* Table */}
      <div className="soc-table-scroll">
        <table className="soc-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Source IP</th>
              <th>Method</th>
              <th>Path</th>
              <th>Attack Type</th>
              <th>Severity</th>
              <th>Payload</th>
              <th>Tool</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    textAlign: "center",
                    color: "var(--text-muted)",
                    padding: "2rem",
                  }}
                >
                  No events found
                </td>
              </tr>
            ) : (
              filtered.map((event) => (
                <tr key={event.id}>
                  <td className="soc-ts">{formatTime(event.timestamp)}</td>
                  <td className="soc-ip">{event.source_ip}</td>
                  <td>
                    <span
                      style={{
                        color:
                          event.method === "POST"
                            ? "var(--accent-orange)"
                            : "var(--accent-blue)",
                        fontWeight: 600,
                      }}
                    >
                      {event.method}
                    </span>
                  </td>
                  <td className="soc-path">{event.path}</td>
                  <td>
                    <span
                      className={`soc-type-${event.attack_type}`}
                      style={{ fontWeight: 600 }}
                    >
                      {ATTACK_LABELS[event.attack_type] ?? event.attack_type}
                    </span>
                  </td>
                  <td>
                    <span className={`soc-pill soc-pill-${event.severity}`}>
                      {event.severity}
                    </span>
                  </td>
                  <td className="soc-payload" title={event.payload}>
                    {event.payload}
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {event.tool_detected ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
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
