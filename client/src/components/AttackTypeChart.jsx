// components/AttackTypeChart.jsx
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = {
  sqli: "#bc8cff",
  xss: "#388bfd",
  bruteforce: "#f85149",
  traversal: "#e3b341",
};

const LABELS = {
  sqli: "SQL Injection",
  xss: "XSS",
  bruteforce: "Brute Force",
  traversal: "Dir Traversal",
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div
      style={{
        background: "#0d1117",
        border: "1px solid rgba(56,139,253,0.2)",
        borderRadius: "6px",
        padding: "8px 12px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px",
      }}
    >
      <div
        style={{ color: d.payload.fill, fontWeight: 600, marginBottom: "2px" }}
      >
        {LABELS[d.name] ?? d.name}
      </div>
      <div style={{ color: "#8b949e" }}>
        Count: <span style={{ color: "#e6edf3" }}>{d.value}</span>
      </div>
      <div style={{ color: "#8b949e" }}>
        Share: <span style={{ color: "#e6edf3" }}>{d.payload.percent}%</span>
      </div>
    </div>
  );
};

const CustomLegend = ({ payload }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      paddingLeft: "8px",
    }}
  >
    {payload.map((entry) => (
      <div
        key={entry.value}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "11px",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: entry.color,
            flexShrink: 0,
          }}
        />
        <span style={{ color: "#8b949e" }}>
          {LABELS[entry.value] ?? entry.value}
        </span>
        <span style={{ color: "#e6edf3", marginLeft: "auto" }}>
          {entry.payload.count}
        </span>
      </div>
    ))}
  </div>
);

export default function AttackTypeChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
        }}
      >
        No attack data yet
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + parseInt(d.count), 0);
  const chartData = data.map((d) => ({
    name: d.attack_type,
    count: parseInt(d.count),
    percent: total > 0 ? Math.round((parseInt(d.count) / total) * 100) : 0,
    fill: COLORS[d.attack_type] ?? "#8b949e",
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="40%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="count"
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.fill} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          content={<CustomLegend />}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
