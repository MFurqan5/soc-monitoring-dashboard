// components/ThreatGauge.jsx
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

function getLabel(score) {
  if (score >= 80) return { text: "CRITICAL", color: "#f85149" };
  if (score >= 60) return { text: "HIGH", color: "#db6d28" };
  if (score >= 40) return { text: "MEDIUM", color: "#e3b341" };
  return { text: "LOW", color: "#39d353" };
}

export default function ThreatGauge({ score }) {
  const { text, color } = getLabel(score);

  // RadialBar needs data as an array with a value 0-100
  const data = [{ value: score, fill: color }];

  return (
    <div style={{ position: "relative", width: "100%", height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="55%"
          innerRadius="62%"
          outerRadius="90%"
          startAngle={210}
          endAngle={-30}
          data={data}
          barSize={14}
        >
          {/* Background track */}
          <RadialBar
            dataKey="value"
            cornerRadius={7}
            background={{ fill: "rgba(56,139,253,0.07)" }}
            clockWise
          />
        </RadialBarChart>
      </ResponsiveContainer>

      {/* Center Text Overlay */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -46%)",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontSize: "38px",
            fontWeight: "700",
            color: color,
            lineHeight: 1,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {score}
        </div>
        <div
          style={{
            fontSize: "11px",
            fontWeight: "600",
            color: color,
            letterSpacing: "0.12em",
            marginTop: "4px",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {text}
        </div>
        <div
          style={{
            fontSize: "10px",
            color: "var(--text-muted)",
            marginTop: "3px",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          / 100
        </div>
      </div>

      {/* Scale labels */}
      <div
        style={{
          position: "absolute",
          bottom: "12px",
          left: "0",
          right: "0",
          display: "flex",
          justifyContent: "space-between",
          padding: "0 18px",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "9px",
          color: "var(--text-muted)",
        }}
      >
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}
