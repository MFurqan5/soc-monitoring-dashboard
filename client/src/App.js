import { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import LiveEventFeed from "./components/LiveEventFeed";
import AttackerProfiles from "./components/AttackerProfiles";
import AttackTypeChart from "./components/AttackTypeChart";
import TimelineChart from "./components/TimelineChart";
import ThreatGauge from "./components/ThreatGuage";
import StatsBar from "./components/StatusBar";
import WorldMap from "./components/WorldMap";
import HoneytokenPanel from "./components/HoneytokenPanel";
import api from "./services/api";
import "./index.css";

const SOCKET_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function App() {
  const [events, setEvents] = useState([]);
  const [attackers, setAttackers] = useState([]);
  const [stats, setStats] = useState(null);
  const [honeytokens, setHoneytokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [honeytokenAlert, setHoneytokenAlert] = useState(null); // { ip, type, triggeredAt }
  const socketRef = useRef(null);

  // ─── Initial HTTP fetch (events + attackers + honeytokens) ───
  const fetchAll = useCallback(async () => {
    try {
      const [eventsData, attackersData, statsData, honeytokensData] = await Promise.all([
        api.getEvents({ limit: 50 }),
        api.getAttackers(),
        api.getStats(),
        api.getHoneytokens(),
      ]);
      setEvents(eventsData.data || []);
      setAttackers(attackersData.data || []);
      setStats(statsData.data || null);
      setHoneytokens(honeytokensData.honeytokens || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Socket.io Connection ───
  useEffect(() => {
    fetchAll();

    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket.io connected:", socket.id);
      setSocketConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket.io disconnected");
      setSocketConnected(false);
    });

    // New attack event — prepend to live feed (keep max 100)
    socket.on("new_attack", ({ events: newEvents }) => {
      setEvents((prev) => {
        const merged = [...newEvents, ...prev];
        return merged.slice(0, 100);
      });
      setLastUpdated(new Date());
    });

    // Stats update from server — replace state
    socket.on("stats_update", (newStats) => {
      setStats(newStats);
      setLastUpdated(new Date());
    });

    // Honeytoken triggered — show banner + update list
    socket.on("honeytoken_triggered", (alert) => {
      setHoneytokenAlert(alert);
      // Also refresh honeytokens list
      api.getHoneytokens()
        .then((data) => setHoneytokens(data.honeytokens || []))
        .catch(() => {});
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchAll]);

  if (loading) {
    return (
      <>
        <title>SOC Dashboard — SecureBank</title>
        <meta name="description" content="Real-time Security Operations Center Dashboard" />
        <div className="soc-loading">
          <div className="soc-loading-inner">
            <div className="soc-pulse" />
            <p>Initialising SOC Dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <title>SOC Dashboard — SecureBank</title>
      <meta name="description" content="Real-time Security Operations Center Dashboard" />

      <div className="soc-root">
        {/* Header */}
        <header className="soc-header">
          <div className="soc-header-left">
            <div className="soc-logo">
              <span className="soc-logo-icon">⬡</span>
              <span className="soc-logo-text">
                SecureBank <span className="soc-logo-accent">SOC</span>
              </span>
            </div>
            <div className="soc-status">
              <span
                className="soc-status-dot"
                style={{ background: socketConnected ? "#39d353" : "#f85149" }}
              />
              {socketConnected ? "LIVE MONITORING" : "POLLING MODE"}
            </div>
          </div>
          <div className="soc-header-right">
            {lastUpdated && (
              <span className="soc-updated">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button className="soc-refresh-btn" onClick={fetchAll}>
              ↻ Refresh
            </button>
          </div>
        </header>

        {/* Honeytoken Alert Banner */}
        {honeytokenAlert && (
          <div className="soc-honeytoken-banner">
            <div className="soc-honeytoken-banner-text">
              <span>🪤</span>
              <span>
                HONEYTOKEN TRIGGERED — IP <strong>{honeytokenAlert.ip}</strong> used a deception
                asset of type <strong>{honeytokenAlert.type}</strong> at{" "}
                {new Date(honeytokenAlert.triggeredAt).toLocaleTimeString()}
              </span>
            </div>
            <button
              className="soc-honeytoken-banner-close"
              onClick={() => setHoneytokenAlert(null)}
            >
              ×
            </button>
          </div>
        )}

        {/* Stats Bar */}
        {stats && <StatsBar stats={stats} />}

        {/* Main Grid */}
        <main className="soc-grid">
          {/* Row 1: Threat Gauge + Attack Type Chart + Timeline */}
          <section className="soc-card soc-gauge-wrap">
            <h2 className="soc-card-title">Threat Level</h2>
            <ThreatGauge score={stats?.threatScore ?? 0} />
          </section>

          <section className="soc-card soc-chart-wrap">
            <h2 className="soc-card-title">Attack Types</h2>
            <AttackTypeChart data={stats?.attackBreakdown ?? []} />
          </section>

          <section className="soc-card soc-timeline-wrap">
            <h2 className="soc-card-title">24h Timeline</h2>
            <TimelineChart data={stats?.timeline ?? []} />
          </section>

          {/* Row 2: World Threat Map */}
          <section className="soc-card" style={{ gridColumn: "1 / -1" }}>
            <h2 className="soc-card-title">🌍 World Threat Map</h2>
            <p style={{ fontSize: "12px", color: "#8b949e", margin: "-6px 0 10px 0" }}>
              Real-time geographic visualization of active threat actors. Circle size indicates
              request volume; colour indicates threat score severity.
            </p>
            <WorldMap attackers={attackers} />
          </section>

          {/* Row 3: Live Feed */}
          <section className="soc-card soc-feed-wrap">
            <h2 className="soc-card-title">
              Live Event Feed
              <span className="soc-badge">{events.length}</span>
            </h2>
            <LiveEventFeed events={events} />
          </section>

          {/* Row 4: Attacker Profiles */}
          <section className="soc-card soc-profiles-wrap">
            <h2 className="soc-card-title">
              Attacker Profiles
              <span className="soc-badge">{attackers.length} IPs</span>
            </h2>
            <AttackerProfiles attackers={attackers} />
          </section>
        </main>

        {/* Honeytoken Panel — full width below the grid */}
        <div style={{ padding: "0 24px 40px 24px" }}>
          <HoneytokenPanel honeytokens={honeytokens} />
        </div>
      </div>
    </>
  );
}
