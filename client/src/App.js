import { useState, useEffect, useCallback } from "react";
import LiveEventFeed from "./components/LiveEventFeed";
import AttackerProfiles from "./components/AttackerProfiles";
import AttackTypeChart from "./components/AttackTypeChart";
import TimelineChart from "./components/TimelineChart";
import ThreatGauge from "./components/ThreatGuage";
import StatsBar from "./components/StatusBar";
import api from "./services/api";
import "./index.css";

export default function App() {
  const [events, setEvents] = useState([]);
  const [attackers, setAttackers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [eventsData, attackersData, statsData] = await Promise.all([
        api.getEvents({ limit: 50 }),
        api.getAttackers(),
        api.getStats(),
      ]);
      setEvents(eventsData.data || []);
      setAttackers(attackersData.data || []);
      setStats(statsData.data || null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  if (loading) {
    return (
      <>
        <title>SOC Dashboard</title>
        <meta
          name="description"
          content="Real-time Security Operations Center Dashboard"
        />
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
      <title>SOC Dashboard</title>
      <meta
        name="description"
        content="Real-time Security Operations Center Dashboard"
      />

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
              <span className="soc-status-dot" />
              LIVE MONITORING
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

          {/* Row 2: Live Feed */}
          <section className="soc-card soc-feed-wrap">
            <h2 className="soc-card-title">
              Live Event Feed
              <span className="soc-badge">{events.length}</span>
            </h2>
            <LiveEventFeed events={events} />
          </section>

          {/* Row 3: Attacker Profiles */}
          <section className="soc-card soc-profiles-wrap">
            <h2 className="soc-card-title">
              Attacker Profiles
              <span className="soc-badge">{attackers.length} IPs</span>
            </h2>
            <AttackerProfiles attackers={attackers} />
          </section>
        </main>
      </div>
    </>
  );
}
