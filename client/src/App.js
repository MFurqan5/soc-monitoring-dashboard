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

const SOCKET_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function App() {
  const [events, setEvents] = useState([]);
  const [attackers, setAttackers] = useState([]);
  const [stats, setStats] = useState(null);
  const [honeytokens, setHoneytokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [honeytokenAlert, setHoneytokenAlert] = useState(null);
  const [selectedAttackType, setSelectedAttackType] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const socketRef = useRef(null);
  const refreshIntervalRef = useRef(null);
  const [screenAlert, setScreenAlert] = useState(null);
  const [alertedIps, setAlertedIps] = useState(new Set());
  const [hasLiveAttack, setHasLiveAttack] = useState(false);

  // ─── Fetch Events with filters ───
  const fetchEvents = useCallback(async () => {
    try {
      const params = { limit: 100 };
      if (selectedAttackType && selectedAttackType !== 'all') {
        params.attack_type = selectedAttackType;
      }
      const response = await api.getEvents(params);
      setEvents(response.data || []);
      return response.data;
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("Failed to load events");
      return [];
    }
  }, [selectedAttackType]);

  // ─── Fetch Attackers ───
  const fetchAttackers = useCallback(async () => {
    try {
      const response = await api.getAttackers();
      setAttackers(response.data || []);
    } catch (err) {
      console.error("Failed to fetch attackers:", err);
      setError("Failed to load attacker profiles");
    }
  }, []);

  // ─── Fetch Stats ───
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.getStats();
      setStats(response.data || null);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  // ─── Fetch Honeytokens ───
  const fetchHoneytokens = useCallback(async () => {
    try {
      const response = await api.getHoneytokens();
      setHoneytokens(response.honeytokens || []);
    } catch (err) {
      console.error("Failed to fetch honeytokens:", err);
    }
  }, []);

  // ─── Fetch All Data ───
  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      await Promise.all([
        fetchEvents(),
        fetchAttackers(),
        fetchStats(),
        fetchHoneytokens(),
      ]);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to load dashboard data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [fetchEvents, fetchAttackers, fetchStats, fetchHoneytokens]);

  // ─── Auto Refresh Setup ───
  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    if (autoRefresh) {
      if (hasLiveAttack) {
        // Poll every 1 second continuously if live attack occurred
        refreshIntervalRef.current = setInterval(() => {
          fetchAll();
        }, 1000);
      } else if (!socketConnected) {
        // Poll every 3 seconds if socket is not connected
        refreshIntervalRef.current = setInterval(() => {
          fetchAll();
        }, 3000);
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, socketConnected, hasLiveAttack, fetchAll]);

  // ─── Socket.io Connection ───
  useEffect(() => {
    fetchAll();

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket.io connected:", socket.id);
      setSocketConnected(true);
      setError(null);
      
      // Request initial data sync
      socket.emit("request_sync");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setSocketConnected(false);
      setError("WebSocket connection failed. Falling back to polling mode.");
    });

    socket.on("disconnect", (reason) => {
      console.log("🔴 Socket.io disconnected:", reason);
      setSocketConnected(false);
    });

    // Real-time attack events
    socket.on("new_attack", (data) => {
      console.log("📡 New attack received:", data);
      
      // Trigger continuous 1-second live refreshes
      setHasLiveAttack(true);

      // Handle both single attack and batch events
      const newEvents = data.events || [data];
      
      // Screen Alert for new attacker IP (only alert on real attacks, not normal page loads)
      const firstEvent = newEvents.find(e => e.attack_type);
      if (firstEvent && firstEvent.source_ip) {
        const sourceIp = firstEvent.source_ip;
        setAlertedIps((prev) => {
          if (!prev.has(sourceIp)) {
            const updated = new Set(prev);
            updated.add(sourceIp);
            
            // Trigger overlay state
            setScreenAlert({
              ip: sourceIp,
              type: firstEvent.attack_type?.toUpperCase() || "THREAT",
              path: firstEvent.path || "/"
            });

            // Auto-dismiss warning after 7 seconds
            setTimeout(() => {
              setScreenAlert(null);
            }, 7000);

            return updated;
          }
          return prev;
        });
      }

      setEvents((prev) => {
        // Remove duplicates by ID
        const existingIds = new Set(prev.map(e => e.id));
        const uniqueNewEvents = newEvents.filter(e => !existingIds.has(e.id));
        const merged = [...uniqueNewEvents, ...prev];
        return merged.slice(0, 200); // Keep last 200 events
      });
      
      setLastUpdated(new Date());
      
      // Refresh attackers and stats on new attack
      fetchAttackers();
      fetchStats();
    });

    // Real-time attacker profile updates
    socket.on("attacker_updated", (attacker) => {
      setAttackers((prev) => {
        const index = prev.findIndex(a => a.ip === attacker.ip);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = attacker;
          return updated;
        }
        return [attacker, ...prev];
      });
    });

    // Stats update from server
    socket.on("stats_update", (newStats) => {
      setStats(newStats);
      setLastUpdated(new Date());
    });

    // Honeytoken triggered
    socket.on("honeytoken_triggered", (alert) => {
      console.log("🪤 Honeytoken triggered:", alert);
      setHoneytokenAlert(alert);
      
      // Refresh honeytokens list
      fetchHoneytokens();
      
      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        setHoneytokenAlert((current) => 
          current === alert ? null : current
        );
      }, 10000);
    });

    // Bulk update for initial sync
    socket.on("initial_sync", (data) => {
      if (data.events) setEvents(data.events.slice(0, 200));
      if (data.attackers) setAttackers(data.attackers);
      if (data.stats) setStats(data.stats);
      if (data.honeytokens) setHoneytokens(data.honeytokens);
      setLastUpdated(new Date());
      setLoading(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchAll, fetchAttackers, fetchStats, fetchHoneytokens]);

  // Handle attack type selection from LiveEventFeed
  const handleAttackTypeSelect = useCallback((attackType) => {
    setSelectedAttackType(attackType);
  }, []);

  // Manual refresh handler
  const handleManualRefresh = useCallback(async () => {
    setLoading(true);
    await fetchAll();
    setLoading(false);
  }, [fetchAll]);

  // Toggle auto refresh
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  if (loading && events.length === 0) {
    return (
      <>
        <title>SOC Dashboard — SecureBank</title>
        <meta name="description" content="Real-time Security Operations Center Dashboard" />
        <div className="soc-loading">
          <div className="soc-loading-inner">
            <div className="soc-pulse" />
            <p>Initialising SOC Dashboard...</p>
            <p style={{ fontSize: "12px", marginTop: "10px", color: "#8b949e" }}>
              Connecting to SecureBank Honeypot Database
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <title>SOC Dashboard — SecureBank</title>
      <meta name="description" content="Real-time Security Operations Center Dashboard" />

      {/* Fullscreen Transparent Red Attack Alert Overlay */}
      {screenAlert && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(248, 81, 73, 0.15)",
          backdropFilter: "blur(8px)",
          border: "4px solid rgba(248, 81, 73, 0.4)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          pointerEvents: "none",
          animation: "overlayPulse 1.5s infinite alternate"
        }}>
          <div style={{
            backgroundColor: "rgba(13, 17, 23, 0.95)",
            border: "2px solid #f85149",
            borderRadius: "12px",
            padding: "40px 60px",
            boxShadow: "0 0 50px rgba(248, 81, 73, 0.6)",
            textAlign: "center",
            maxWidth: "600px"
          }}>
            <h1 style={{
              color: "#f85149",
              fontFamily: "var(--font-mono)",
              fontSize: "32px",
              fontWeight: "bold",
              letterSpacing: "0.1em",
              margin: 0,
              textTransform: "uppercase",
              animation: "blink 1s infinite"
            }}>
              🚨 ATTACK DETECTED 🚨
            </h1>
            <p style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-ui)",
              fontSize: "18px",
              marginTop: "20px",
              marginBottom: "10px"
            }}>
              A security threat has been intercepted on SecureBank!
            </p>
            <div style={{
              background: "rgba(248, 81, 73, 0.08)",
              border: "1px solid rgba(248, 81, 73, 0.2)",
              borderRadius: "6px",
              padding: "16px",
              marginTop: "16px",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              textAlign: "left",
              color: "var(--text-secondary)"
            }}>
              <div><strong style={{ color: "#f85149" }}>Attacker IP:</strong> {screenAlert.ip}</div>
              <div><strong style={{ color: "#f85149" }}>Attack Type:</strong> {screenAlert.type}</div>
              <div><strong style={{ color: "#f85149" }}>Endpoint:</strong> {screenAlert.path}</div>
            </div>
            <p style={{
              color: "var(--text-muted)",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              marginTop: "20px",
              marginBottom: 0
            }}>
              This notification will automatically dismiss in 7 seconds.
            </p>
          </div>
        </div>
      )}

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
              {!socketConnected && autoRefresh && (
                <span style={{ marginLeft: "8px", fontSize: "10px" }}>
                  (auto-refresh every 3s)
                </span>
              )}
            </div>
          </div>
          <div className="soc-header-right">
            {error && (
              <span className="soc-error-badge" style={{ 
                background: "rgba(248,81,73,0.1)", 
                color: "#f85149", 
                padding: "4px 8px", 
                borderRadius: "4px", 
                fontSize: "11px",
                marginRight: "12px"
              }}>
                ⚠️ {error}
              </span>
            )}
            {lastUpdated && (
              <span className="soc-updated">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button 
              className="soc-refresh-btn" 
              onClick={handleManualRefresh}
              disabled={loading}
            >
              {loading ? "⟳ Loading..." : "↻ Refresh"}
            </button>
            <button 
              className={`soc-auto-refresh-btn ${autoRefresh ? 'active' : ''}`}
              onClick={toggleAutoRefresh}
              style={{
                background: autoRefresh ? "rgba(57,211,83,0.1)" : "transparent",
                border: `1px solid ${autoRefresh ? "#39d353" : "var(--border)"}`,
                color: autoRefresh ? "#39d353" : "var(--text-muted)"
              }}
            >
              {autoRefresh ? "⏸ Auto" : "▶ Auto"}
            </button>
          </div>
        </header>

        {/* Honeytoken Alert Banner */}
        {honeytokenAlert && (
          <div className="soc-honeytoken-banner" style={{
            background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
            color: "white",
            padding: "12px 20px",
            margin: "0 24px 20px 24px",
            borderRadius: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            animation: "slideDown 0.3s ease"
          }}>
            <div className="soc-honeytoken-banner-text" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span style={{ fontSize: "20px" }}>🪤</span>
              <span>
                <strong>HONEYTOKEN TRIGGERED</strong> — IP <strong>{honeytokenAlert.attacker_ip || honeytokenAlert.ip}</strong> used a deception
                asset of type <strong>{honeytokenAlert.type || "credential"}</strong> at{" "}
                {new Date(honeytokenAlert.triggered_at || honeytokenAlert.triggeredAt).toLocaleTimeString()}
              </span>
            </div>
            <button
              className="soc-honeytoken-banner-close"
              onClick={() => setHoneytokenAlert(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "24px",
                cursor: "pointer",
                padding: "0 8px"
              }}
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
            <ThreatGauge score={stats?.avg_threat_score || stats?.threatScore || 0} />
          </section>

          <section className="soc-card soc-chart-wrap">
            <h2 className="soc-card-title">Attack Types</h2>
            <AttackTypeChart data={stats?.attack_breakdown || stats?.attackBreakdown || []} />
          </section>

          <section className="soc-card soc-timeline-wrap">
            <h2 className="soc-card-title">24h Timeline</h2>
            <TimelineChart data={stats?.timeline || []} />
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
            <LiveEventFeed 
              events={events} 
              onAttackTypeSelect={handleAttackTypeSelect}
            />
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

        {/* Honeytoken Panel */}
        <div style={{ padding: "0 24px 40px 24px" }}>
          <HoneytokenPanel 
            honeytokens={honeytokens} 
            onRefresh={fetchHoneytokens}
          />
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes overlayPulse {
          from {
            background-color: rgba(248, 81, 73, 0.1);
            border-color: rgba(248, 81, 73, 0.3);
          }
          to {
            background-color: rgba(248, 81, 73, 0.25);
            border-color: rgba(248, 81, 73, 0.6);
          }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        .soc-auto-refresh-btn {
          margin-left: 8px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-family: var(--font-mono);
          cursor: pointer;
          transition: all 0.15s;
        }
        
        .soc-auto-refresh-btn:hover {
          opacity: 0.8;
        }
        
        .soc-error-badge {
          animation: pulse 2s infinite;
        }
      `}</style>
    </>
  );
}