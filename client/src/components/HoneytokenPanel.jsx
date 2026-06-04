import { useState } from "react";

export default function HoneytokenPanel({ honeytokens = [] }) {
  const [filter, setFilter] = useState("all");

  const filteredTokens = honeytokens.filter((tok) => {
    if (filter === "triggered") return tok.alert_triggered_at !== null;
    if (filter === "active") return tok.alert_triggered_at === null;
    return true;
  });

  return (
    <div className="soc-card" style={{ marginTop: "24px" }}>
      <div className="soc-card-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 className="soc-card-title" style={{ margin: 0 }}>
          <span style={{ color: "#f85149" }}>🪤</span> Deception Technology & Honeytokens
        </h3>
        
        {/* Filter controls */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className={`soc-tab-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Tokens ({honeytokens.length})
          </button>
          <button
            className={`soc-tab-btn ${filter === "triggered" ? "active" : ""}`}
            onClick={() => setFilter("triggered")}
            style={{ color: filter === "triggered" ? "#f85149" : "" }}
          >
            Triggered ({honeytokens.filter((t) => t.alert_triggered_at).length})
          </button>
          <button
            className={`soc-tab-btn ${filter === "active" ? "active" : ""}`}
            onClick={() => setFilter("active")}
            style={{ color: filter === "active" ? "#39d353" : "" }}
          >
            Active ({honeytokens.filter((t) => !t.alert_triggered_at).length})
          </button>
        </div>
      </div>

      <p style={{ fontSize: "12px", color: "#8b949e", margin: "4px 0 16px 0" }}>
        Fake API keys, credentials, and configuration files planted in responses to track and identify attacker actions.
      </p>

      {filteredTokens.length === 0 ? (
        <div className="soc-empty" style={{ padding: "30px", textCombineUpright: "center" }}>
          No honeytokens matching filter.
        </div>
      ) : (
        <div className="soc-table-wrapper" style={{ overflowX: "auto" }}>
          <table className="soc-table">
            <thead>
              <tr>
                <th>Token ID</th>
                <th>Type</th>
                <th>Credential Snippet</th>
                <th>Target IP</th>
                <th>Created At</th>
                <th>Triggered At</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTokens.map((tok) => {
                const isTriggered = tok.alert_triggered_at !== null;
                const valueSnippet = tok.value
                  ? tok.type === "credential"
                    ? `User: ${tok.value.username || ""}`
                    : tok.type === "api_key" || tok.type === "apikey"
                    ? `Key: ${(tok.value.key || "").substring(0, 12)}...`
                    : tok.type === "file"
                    ? `File: ${tok.value.filename || ""}`
                    : JSON.stringify(tok.value).substring(0, 30) + "..."
                  : "N/A";

                return (
                  <tr key={tok.id} className={isTriggered ? "honeytoken-row-triggered" : ""}>
                    <td style={{ fontFamily: "monospace", fontSize: "11px", color: "#388bfd" }}>
                      {String(tok.id).substring(0, 8)}...
                    </td>
                    <td>
                      <span className="soc-badge" style={{ textTransform: "uppercase" }}>
                        {tok.type}
                      </span>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "11px", color: "#e6edf3" }}>
                      {valueSnippet}
                    </td>
                    <td style={{ fontFamily: "monospace" }}>
                      {tok.attacker_ip || tok.details?.ip || "—"}
                    </td>
                    <td style={{ fontSize: "11px", color: "#8b949e" }}>
                      {new Date(tok.created_at).toLocaleString()}
                    </td>
                    <td style={{ fontSize: "11px" }}>
                      {isTriggered ? (
                        <span style={{ color: "#f85149", fontWeight: "bold" }}>
                          {new Date(tok.alert_triggered_at).toLocaleTimeString()}
                        </span>
                      ) : (
                        <span style={{ color: "#8b949e" }}>—</span>
                      )}
                    </td>
                    <td>
                      {isTriggered ? (
                        <span className="honeytoken-status-triggered">
                          TRIGGERED
                        </span>
                      ) : (
                        <span className="honeytoken-status-active">
                          ACTIVE
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
