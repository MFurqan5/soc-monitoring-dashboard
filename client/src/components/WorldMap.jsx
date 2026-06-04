import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function threatColor(score) {
  if (score >= 80) return "#f85149";   // CRITICAL — red
  if (score >= 60) return "#db6d28";   // HIGH — orange
  if (score >= 40) return "#e3b341";   // MEDIUM — yellow
  return "#39d353";                    // LOW — green
}

export default function WorldMap({ attackers = [] }) {
  // Filter for attackers with valid latitude/longitude
  const mappedAttackers = attackers.filter(
    (a) => a.latitude !== null && a.longitude !== null && !isNaN(a.latitude) && !isNaN(a.longitude)
  );

  return (
    <div style={{ height: "320px", width: "100%", borderRadius: "8px", overflow: "hidden" }}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom={false}
        className="leaflet-container"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {mappedAttackers.map((attacker) => (
          <CircleMarker
            key={attacker.ip}
            center={[parseFloat(attacker.latitude), parseFloat(attacker.longitude)]}
            radius={Math.min(6 + (attacker.total_requests || 0) / 5, 20)}
            fillColor={threatColor(attacker.threat_score)}
            color={threatColor(attacker.threat_score)}
            fillOpacity={0.7}
            weight={1}
          >
            <Popup>
              <div style={{ fontFamily: "monospace", fontSize: "12px", minWidth: "180px" }}>
                <strong style={{ color: "#388bfd" }}>{attacker.ip}</strong><br/>
                {attacker.country || "Unknown Country"} / {attacker.city || "Unknown City"}<br/>
                Score: {attacker.threat_score}/100<br/>
                Tool: {attacker.tool || "Unknown Tool"}<br/>
                Requests: {attacker.total_requests || 0}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
