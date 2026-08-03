import { useState, useEffect } from 'react'
import './App.css'

const VITE_API_URL = import.meta.env.VITE_API_URL;

function App() {

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("processing");

  // ── Vehicle Processing state ───────────────────────────────────────────────
  const [plateNumber, setPlateNumber] = useState("No vehicle detected")
  const [operation, setOperation] = useState("No operation selected")
  const [entryTime, setEntryTime] = useState(null)
  const [exitTime, setExitTime] = useState(null)
  const [durationMinutes, setDurationMinutes] = useState(null)
  const [feeRands, setFeeRands] = useState(null)
  const [status, setStatus] = useState("Waiting for processing")
  const [selectedOperation, setSelectedOperation] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  // ── Sessions History state ─────────────────────────────────────────────────
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);

  // ── Fetch sessions when Sessions tab is opened ─────────────────────────────
  useEffect(() => {
    if (activeTab === "sessions") {
      fetchSessions();
    }
  }, [activeTab]);

  async function fetchSessions() {
    try {
      setSessionsLoading(true);
      setSessionsError(null);

      const response = await fetch(`${VITE_API_URL}/get-sessions`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch sessions");
      }

      setSessions(data.sessions || []);
    } catch (error) {
      console.error(error);
      setSessionsError("❌ Error fetching sessions from AWS");
    } finally {
      setSessionsLoading(false);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function convertToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (error) => reject(error);
    });
  }

  function formatTime(isoString) {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleString("en-ZA", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  // ── Vehicle Processing handler ─────────────────────────────────────────────
  async function handleProcessVehicle() {
    if (!selectedFile) {
      alert("Please select a vehicle image.");
      return;
    }

    if (!selectedOperation) {
      alert("Please select Entry or Exit.");
      return;
    }

    try {
      setStatus("Processing...");

      const imageBase64 = await convertToBase64(selectedFile);

      const response = await fetch(`${VITE_API_URL}/process-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: selectedOperation,
          image: imageBase64,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }

      setPlateNumber(data.plate_number || "Unknown");
      setOperation(data.operation || selectedOperation);
      setEntryTime(data.entry_time || null);
      setExitTime(data.exit_time || null);
      setDurationMinutes(data.duration_minutes ?? null);
      setFeeRands(data.fee_rands ?? null);
      setStatus(data.message || "Processed successfully");

    } catch (error) {
      console.error(error);
      setStatus("❌ Error connecting to AWS");
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="app">

      <header className="header">
        <h1>AutoPark Vision</h1>
        <p>AI-Powered Ticketless Parking Management System</p>
      </header>

      {/* ── Tab Toggle ── */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "processing" ? "active" : ""}`}
          onClick={() => setActiveTab("processing")}
        >
           Vehicle Processing
        </button>
        <button
          className={`tab-btn ${activeTab === "sessions" ? "active" : ""}`}
          onClick={() => setActiveTab("sessions")}
        >
           Sessions History
        </button>
      </div>

      <main>

        {/* ── Vehicle Processing Tab ── */}
        {activeTab === "processing" && (
          <>
            <section className="upload-section">
              <h2>Vehicle Processing</h2>

              <label htmlFor="vehicleImage">Upload Vehicle Image</label>
              <input
                type="file"
                id="vehicleImage"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />

              <h3>Operation</h3>

              <div className="operation-options">
                <label>
                  <input
                    type="radio"
                    name="operation"
                    value="ENTRY"
                    onChange={() => setSelectedOperation("ENTRY")}
                  />
                  Entry
                </label>

                <label>
                  <input
                    type="radio"
                    name="operation"
                    value="EXIT"
                    onChange={() => setSelectedOperation("EXIT")}
                  />
                  Exit
                </label>
              </div>

              <button onClick={handleProcessVehicle}>
                Process Vehicle
              </button>
            </section>

            {/* ── Processing Result ── */}
            <section className="result-section">
              <h2>Processing Result</h2>
              <p><strong>License Plate:</strong> {plateNumber}</p>
              <p><strong>Operation:</strong> {operation}</p>
              <p><strong>Status:</strong> {status}</p>

              {entryTime && (
                <p><strong>Entry Time:</strong> {formatTime(entryTime)}</p>
              )}

              {exitTime && (
                <p><strong>Exit Time:</strong> {formatTime(exitTime)}</p>
              )}

              {durationMinutes !== null && (
                <p><strong>Duration:</strong> {durationMinutes} minute(s)</p>
              )}

              {/* ✅ Bug fix — safely parse feeRands as a number */}
              {feeRands !== null && (
                <p><strong>Fee:</strong> R{parseFloat(feeRands).toFixed(2)}</p>
              )}
            </section>
          </>
        )}

        {/* ── Sessions History Tab ── */}
        {activeTab === "sessions" && (
          <section className="sessions-section">
            <div className="sessions-header">
              <h2>Sessions History</h2>
              <button onClick={fetchSessions} disabled={sessionsLoading}>
                {sessionsLoading ? "Refreshing..." : "🔄 Refresh"}
              </button>
            </div>

            {/* Loading state */}
            {sessionsLoading && (
              <p className="sessions-loading">Loading sessions...</p>
            )}

            {/* Error state */}
            {sessionsError && (
              <p className="sessions-error">{sessionsError}</p>
            )}

            {/* Empty state */}
            {!sessionsLoading && !sessionsError && sessions.length === 0 && (
              <p className="sessions-empty">No sessions found.</p>
            )}

            {/* Sessions table */}
            {!sessionsLoading && !sessionsError && sessions.length > 0 && (
              <div className="table-wrapper">
                <table className="sessions-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Plate Number</th>
                      <th>Entry Time</th>
                      <th>Exit Time</th>
                      <th>Duration</th>
                      <th>Fee</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session, index) => (
                      <tr key={session.entry_id}>
                        <td>{index + 1}</td>
                        <td>{session.plate_number}</td>
                        <td>{formatTime(session.entry_time)}</td>
                        <td>{formatTime(session.exit_time)}</td>
                        <td>
                          {session.duration_minutes !== null
                            ? `${session.duration_minutes} min`
                            : "N/A"}
                        </td>
                        <td>R{parseFloat(session.fee_rands).toFixed(2)}</td>
                        <td>
                          <span className={`badge ${session.status === "COMPLETED" ? "badge-success" : "badge-active"}`}>
                            {session.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </section>
        )}

      </main>

    </div>
  )
}

export default App
