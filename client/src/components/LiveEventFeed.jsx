// components/LiveEventFeed.jsx
import { useState, useEffect, useMemo } from "react";

const ATTACK_LABELS = {
  sqli: "SQL Injection",
  xss: "XSS",
  bruteforce: "Brute Force",
  traversal: "Dir Traversal",
  idor: "IDOR",
  csrf: "CSRF",
  recon: "Reconnaissance",
};

// Convert severity number (1-10) to label
function getSeverityLabel(severity) {
  if (typeof severity === 'number') {
    if (severity >= 9) return "CRITICAL";
    if (severity >= 7) return "HIGH";
    if (severity >= 4) return "MEDIUM";
    return "LOW";
  }
  // If it's already a string
  const sev = String(severity).toUpperCase();
  if (sev === 'CRITICAL' || sev === 'HIGH' || sev === 'MEDIUM' || sev === 'LOW') {
    return sev;
  }
  return "MEDIUM";
}

// Get color based on severity number or label
function getSeverityColor(severity) {
  const label = getSeverityLabel(severity);
  const colors = {
    CRITICAL: "#dc2626",
    HIGH: "#f97316",
    MEDIUM: "#eab308",
    LOW: "#22c55e",
  };
  return colors[label] || "#6b7280";
}

// Get background color for attack type
function getAttackTypeColor(attackType) {
  const colors = {
    sqli: "rgba(239, 68, 68, 0.2)",
    xss: "rgba(245, 158, 11, 0.2)",
    bruteforce: "rgba(59, 130, 246, 0.2)",
    traversal: "rgba(139, 92, 246, 0.2)",
    idor: "rgba(236, 72, 153, 0.2)",
    csrf: "rgba(168, 85, 247, 0.2)",
    recon: "rgba(107, 114, 128, 0.2)",
  };
  return colors[attackType] || "rgba(107, 114, 128, 0.2)";
}

function formatTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  // Show relative time for recent events
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  
  // Otherwise show full timestamp
  return (
    d.toLocaleTimeString("en-GB", { hour12: false }) +
    " " +
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
  );
}

export default function LiveEventFeed({ events, onAttackTypeSelect }) {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // desc = newest first

  // Sort events by timestamp (newest first by default)
  const sortedEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    
    const sorted = [...events].sort((a, b) => {
      const timeA = new Date(a.timestamp);
      const timeB = new Date(b.timestamp);
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });
    
    return sorted;
  }, [events, sortOrder]);

  // Apply filters
  const filteredEvents = useMemo(() => {
    let result = sortedEvents;
    
    // Filter by attack type
    if (filter !== "all") {
      result = result.filter((e) => e.attack_type === filter);
    }
    
    // Filter by search term (IP, path, payload)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((e) => 
        e.source_ip?.toLowerCase().includes(term) ||
        e.path?.toLowerCase().includes(term) ||
        e.payload?.toLowerCase().includes(term) ||
        e.attack_type?.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [sortedEvents, filter, searchTerm]);

  // Handle attack type selection
  const handleFilterChange = (type) => {
    setFilter(type);
    if (onAttackTypeSelect) {
      onAttackTypeSelect(type === "all" ? null : type);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilter("all");
    setSearchTerm("");
    setSortOrder("desc");
    if (onAttackTypeSelect) {
      onAttackTypeSelect(null);
    }
  };

  return (
    <div>
      {/* Filter Controls */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Attack Type Tabs */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["all", "sqli", "xss", "bruteforce", "traversal", "idor", "csrf"].map((type) => (
            <button
              key={type}
              onClick={() => handleFilterChange(type)}
              style={{
                background:
                  filter === type ? "rgba(56,139,253,0.15)" : "transparent",
                border: `1px solid ${filter === type ? "var(--accent-blue)" : "var(--border)"}`,
                color:
                  filter === type ? "var(--accent-blue)" : "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                padding: "6px 14px",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                transition: "all 0.15s",
                fontWeight: filter === type ? "600" : "400",
              }}
            >
              {type === "all" ? "ALL" : ATTACK_LABELS[type] || type.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div style={{ flex: 1, minWidth: "200px" }}>
          <input
            type="text"
            placeholder="🔍 Search IP, path, payload..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 12px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
            }}
          />
        </div>

        {/* Sort Order Toggle */}
        <button
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            padding: "6px 12px",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {sortOrder === "desc" ? "⬇️ Newest First" : "⬆️ Oldest First"}
        </button>

        {/* Clear Filters Button */}
        {(filter !== "all" || searchTerm) && (
          <button
            onClick={clearFilters}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--accent-orange)",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
            }}
          >
            ✕ Clear Filters
          </button>
        )}

        {/* Event Count */}
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--text-muted)",
            background: "var(--bg-secondary)",
            padding: "4px 10px",
            borderRadius: "var(--radius-sm)",
          }}
        >
          {filteredEvents.length} / {events?.length || 0} events
        </span>
      </div>

      {/* Table */}
      <div className="soc-table-scroll" style={{ maxHeight: "600px", overflowY: "auto" }}>
        <table className="soc-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, background: "var(--bg-primary)", zIndex: 10 }}>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "12px", textAlign: "left" }}>Timestamp</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Source IP</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Method</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Path</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Attack Type</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Severity</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Payload</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Tool</th>
             </tr>
          </thead>
          <tbody>
            {filteredEvents.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    textAlign: "center",
                    color: "var(--text-muted)",
                    padding: "3rem",
                  }}
                >
                  {events?.length === 0 ? "No events captured yet" : "No matching events found"}
                </td>
              </tr>
            ) : (
              filteredEvents.map((event, index) => {
                const severityLabel = getSeverityLabel(event.severity);
                return (
                  <tr
                    key={event.id || index}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(56,139,253,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)";
                    }}
                  >
                    <td
                      className="soc-ts"
                      style={{
                        padding: "10px 12px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatTime(event.timestamp)}
                    </td>
                    <td
                      className="soc-ip"
                      style={{
                        padding: "10px 12px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        fontWeight: 500,
                      }}
                    >
                      {event.source_ip}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          color:
                            event.method === "POST"
                              ? "var(--accent-orange)"
                              : event.method === "GET"
                              ? "var(--accent-blue)"
                              : "var(--text-muted)",
                          fontWeight: 600,
                          fontFamily: "var(--font-mono)",
                          fontSize: "12px",
                        }}
                      >
                        {event.method}
                      </span>
                    </td>
                    <td
                      className="soc-path"
                      style={{
                        padding: "10px 12px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        maxWidth: "250px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={event.path}
                    >
                      {event.path}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        className={`soc-type-${event.attack_type}`}
                        style={{
                          fontWeight: 600,
                          fontSize: "11px",
                          padding: "2px 8px",
                          borderRadius: "var(--radius-sm)",
                          background: getAttackTypeColor(event.attack_type),
                          color: "#000",
                        }}
                      >
                        {ATTACK_LABELS[event.attack_type] ?? event.attack_type?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        className={`soc-pill soc-pill-${severityLabel}`}
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "11px",
                          fontWeight: 600,
                          background: getSeverityColor(event.severity),
                          color: "#fff",
                        }}
                      >
                        {severityLabel}
                      </span>
                    </td>
                    <td
                      className="soc-payload"
                      style={{
                        padding: "10px 12px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        maxWidth: "300px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "var(--text-secondary)",
                      }}
                      title={event.payload}
                    >
                      {event.payload?.substring(0, 100) || "—"}
                      {event.payload?.length > 100 ? "..." : ""}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        color: "var(--text-secondary)",
                        fontSize: "11px",
                      }}
                    >
                      {event.tool_detected || event.tool || "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Live Indicator */}
      <div
        style={{
          marginTop: "12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "11px",
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#22c55e",
            animation: "pulse 1.5s infinite",
          }}
        />
        Live Feed • Auto-refreshes every 5 seconds
      </div>

      {/* Add pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}