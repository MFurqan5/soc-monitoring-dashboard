// components/TimelineChart.jsx
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
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
      <div style={{ color: "#8b949e", marginBottom: "4px" }}>{label}</div>
      <div style={{ color: "#388bfd", fontWeight: 600 }}>
        {payload[0].value} attacks
      </div>
    </div>
  );
};

export default function TimelineChart({ data }) {
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
        No timeline data yet
      </div>
    );
  }

  // Format hour label like "08:00"
  const chartData = data.map((row) => ({
    hour: formatHour(row.hour),
    count: parseInt(row.count),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart
        data={chartData}
        margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#388bfd" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#388bfd" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,139,253,0.08)" />
        <XAxis
          dataKey="hour"
          tick={{
            fill: "#484f58",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
          }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{
            fill: "#484f58",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
          }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#388bfd"
          strokeWidth={2}
          fill="url(#blueGrad)"
          dot={false}
          activeDot={{
            r: 4,
            fill: "#388bfd",
            stroke: "#0d1117",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function formatHour(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
