import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function SessionTimeline({ sessionId, attackerIp, onClose }) {
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    async function fetchTimeline() {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/sessions/${sessionId}/timeline`);
        if (res.data.success) {
          setTimeline(res.data.timeline);
          if (res.data.timeline.events.length > 0) {
            setSelectedEvent(res.data.timeline.events[0]);
          }
        } else {
          setError(res.data.error || "Failed to load timeline");
        }
      } catch (err) {
        console.error("Error fetching timeline:", err);
        setError("Network error fetching session timeline");
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) {
      fetchTimeline();
    }
  }, [sessionId]);

  if (!sessionId) return null;

  return (
    <div className="soc-modal-overlay">
      <div className="soc-modal-container">
        {/* Modal Header */}
        <div className="soc-modal-header">
          <div>
            <h3 className="soc-card-title" style={{ margin: 0, color: "#388bfd" }}>
              Forensic Session Timeline
            </h3>
            <span style={{ fontSize: "12px", color: "#8b949e" }}>
              Session: <span style={{ fontFamily: "monospace" }}>{sessionId}</span> | Attacker:{" "}
              <span style={{ fontFamily: "monospace", color: "#e6edf3" }}>{attackerIp}</span>
            </span>
          </div>
          <button className="soc-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="soc-modal-body">
          {loading ? (
            <div className="soc-loading">Loading forensic telemetry...</div>
          ) : error ? (
            <div className="soc-error">{error}</div>
          ) : !timeline || timeline.events.length === 0 ? (
            <div className="soc-empty">No telemetry recorded for this session.</div>
          ) : (
            <div className="soc-timeline-split">
              {/* Left Column: Timeline Feed */}
              <div className="soc-timeline-feed">
                <div className="soc-timeline-stats">
                  <span>Total: {timeline.summary.total} requests</span>
                  <span style={{ color: "#39d353" }}>
                    Success: {timeline.summary.successful}
                  </span>
                  <span style={{ color: "#f85149" }}>
                    Failed: {timeline.summary.failed}
                  </span>
                </div>

                <div className="soc-timeline-list">
                  {timeline.events.map((event, idx) => {
                    const isSelected = selectedEvent && selectedEvent.sequence === event.sequence;
                    const isError = event.status >= 400;

                    return (
                      <div
                        key={event.sequence}
                        className={`soc-timeline-item ${isSelected ? "active" : ""}`}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="soc-timeline-badge-column">
                          <span
                            className={`soc-timeline-status-badge ${
                              isError ? "error" : "success"
                            }`}
                          >
                            {event.status}
                          </span>
                          <span className="soc-timeline-delta">{event.timeSincePrevious}</span>
                        </div>

                        <div className="soc-timeline-detail-column">
                          <span className="soc-timeline-method">{event.method}</span>
                          <span className="soc-timeline-path">{event.path}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Selected Event Detail Inspector */}
              <div className="soc-timeline-inspector">
                {selectedEvent ? (
                  <div>
                    <h4 style={{ margin: "0 0 12px 0", color: "#388bfd", fontSize: "14px" }}>
                      HTTP Request Inspector (Seq #{selectedEvent.sequence})
                    </h4>

                    <div className="soc-inspector-row">
                      <span className="label">Timestamp</span>
                      <span className="value">
                        {new Date(selectedEvent.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="soc-inspector-row">
                      <span className="label">HTTP Method</span>
                      <span className="value soc-code-inline">{selectedEvent.method}</span>
                    </div>

                    <div className="soc-inspector-row">
                      <span className="label">Target Path</span>
                      <span className="value soc-code-inline">{selectedEvent.path}</span>
                    </div>

                    <div className="soc-inspector-row">
                      <span className="label">Response Code</span>
                      <span
                        className={`value ${
                          selectedEvent.status >= 400 ? "text-error" : "text-success"
                        }`}
                        style={{ fontWeight: "bold" }}
                      >
                        {selectedEvent.status}
                      </span>
                    </div>

                    <div className="soc-inspector-payload-box">
                      <div className="payload-header">POST/PUT Request Body (Payload)</div>
                      <pre className="payload-content">
                        {selectedEvent.payload
                          ? typeof selectedEvent.payload === "string"
                            ? selectedEvent.payload
                            : JSON.stringify(selectedEvent.payload, null, 2)
                          : "Empty Payload / GET parameters only"}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="soc-empty">Select a request from the timeline to inspect.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
