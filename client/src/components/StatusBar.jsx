// components/StatsBar.jsx

export default function StatsBar({ stats }) {
  const criticalCount =
    stats.severityBreakdown?.find((s) => s.severity === "CRITICAL" || s.severity_label === "CRITICAL")?.count ?? 0;
  const recentCount = stats.recentActivity ?? 0;

  const items = [
    {
      label: "Total Events",
      value: stats.totalEvents?.toLocaleString() ?? "0",
      sub: "all time",
      color: "var(--accent-blue)",
    },
    {
      label: "Last 10 Min",
      value: recentCount,
      sub: recentCount > 5 ? "⚠ high activity" : "normal",
      color: recentCount > 5 ? "var(--accent-red)" : "var(--accent-cyan)",
    },
    {
      label: "Critical",
      value: criticalCount,
      sub: "severity events",
      color:
        criticalCount > 0
          ? "var(--severity-critical)"
          : "var(--text-secondary)",
    },
    {
      label: "Threat Score",
      value: `${stats.threatScore ?? 0}`,
      sub: getThreatLabel(stats.threatScore),
      color: getThreatColor(stats.threatScore),
    },
    {
      label: "Unique IPs",
      value: stats.topAttackers?.length ?? 0,
      sub: "tracked attackers",
      color: "var(--accent-purple)",
    },
    {
      label: "Top Country",
      value: stats.topCountries?.[0]?.country ?? "—",
      sub: `${stats.topCountries?.[0]?.count ?? 0} attacks`,
      color: "var(--accent-orange)",
    },
  ];

  return (
    <div className="soc-stats-bar">
      {items.map((item) => (
        <div className="soc-stat" key={item.label}>
          <span className="soc-stat-label">{item.label}</span>
          <span className="soc-stat-value" style={{ color: item.color }}>
            {item.value}
          </span>
          <span className="soc-stat-sub">{item.sub}</span>
        </div>
      ))}
    </div>
  );
}

function getThreatLabel(score) {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

function getThreatColor(score) {
  if (score >= 80) return "var(--severity-critical)";
  if (score >= 60) return "var(--severity-high)";
  if (score >= 40) return "var(--severity-medium)";
  return "var(--severity-low)";
}
