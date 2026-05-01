import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, AlertTriangle, CheckCircle, Clock, ShieldAlert } from 'lucide-react';

const API_BASE = 'http://localhost:3001';

function App() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 3000); // Poll for live updates
    return () => clearInterval(interval);
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await axios.get(`${API_BASE}/incidents`);
      setIncidents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleIncidentClick = async (id: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/incidents/${id}`);
      setSelectedIncident(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const transitionStatus = async () => {
    if (!selectedIncident) return;
    try {
      const res = await axios.patch(`${API_BASE}/incidents/${selectedIncident.workItem.id}/status`);
      setSelectedIncident({ ...selectedIncident, workItem: res.data });
      fetchIncidents();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Transition failed');
    }
  };

  const submitRCA = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    
    try {
      await axios.post(`${API_BASE}/incidents/${selectedIncident.workItem.id}/rca`, data);
      handleIncidentClick(selectedIncident.workItem.id);
      alert('RCA Submitted Successfully');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '40px' }}>
      <header style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>IMS <span style={{ color: 'var(--accent-color)' }}>Mission Control</span></h1>
          <p style={{ color: 'var(--text-secondary)' }}>Resilient Distributed Stack Monitoring</p>
        </div>
        <div className="glass-card" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center' }}>
          <span className="live-indicator"></span>
          <span>SYSTEM LIVE</span>
        </div>
      </header>

      <div className="dashboard-grid">
        <section className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '10px' }}>
            <Activity size={20} color="var(--accent-color)" />
            <h2>Active Incidents Feed</h2>
          </div>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {incidents.map((incident) => (
              <div key={incident.id} className="incident-item" onClick={() => handleIncidentClick(incident.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <ShieldAlert className={`severity-${incident.severity}`} size={24} />
                  <div>
                    <div style={{ fontWeight: '600' }}>{incident.componentId}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Started: {new Date(incident.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span className={`severity-badge severity-${incident.severity}`}>{incident.severity}</span>
                  <span style={{ fontSize: '12px', opacity: 0.7 }}>{incident.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '10px' }}>
            <Clock size={20} color="var(--accent-color)" />
            <h2>Incident Deep-Dive</h2>
          </div>
          {selectedIncident ? (
            <div>
              <h3>{selectedIncident.workItem.componentId}</h3>
              <p style={{ margin: '10px 0', opacity: 0.8 }}>Status: {selectedIncident.workItem.status}</p>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={transitionStatus}>Transition to Next State</button>
              </div>

              {selectedIncident.workItem.status === 'RESOLVED' && !selectedIncident.workItem.rca && (
                <form onSubmit={submitRCA} className="glass-card" style={{ padding: '20px', marginTop: '20px' }}>
                  <h4>Submit Root Cause Analysis (RCA)</h4>
                  <label>Start Time</label>
                  <input type="datetime-local" name="startTime" required />
                  <label>End Time</label>
                  <input type="datetime-local" name="endTime" required />
                  <label>Category</label>
                  <select name="category">
                    <option>Infrastructure</option>
                    <option>Code Bug</option>
                    <option>Deployment</option>
                    <option>External Dependency</option>
                  </select>
                  <label>Fix Applied</label>
                  <textarea name="fixApplied" required></textarea>
                  <label>Prevention Steps</label>
                  <textarea name="preventionSteps" required></textarea>
                  <button type="submit" style={{ marginTop: '15px', width: '100%' }}>Submit RCA</button>
                </form>
              )}

              {selectedIncident.workItem.rca && (
                <div className="glass-card" style={{ background: 'rgba(16, 185, 129, 0.1)', marginTop: '20px' }}>
                  <h4 style={{ color: 'var(--accent-color)' }}>RCA COMPLETED</h4>
                  <p>Category: {selectedIncident.workItem.rca.category}</p>
                  <p>MTTR: {selectedIncident.workItem.mttr} minutes</p>
                </div>
              )}

              <div style={{ marginTop: '20px' }}>
                <h4>Raw Signals (Audit Log)</h4>
                <div style={{ fontSize: '11px', maxHeight: '200px', overflowY: 'auto', background: '#000', padding: '10px', borderRadius: '8px', marginTop: '10px' }}>
                  {selectedIncident.signals.map((s: any) => (
                    <div key={s._id} style={{ marginBottom: '5px', color: '#0f0' }}>
                      [{new Date(s.timestamp).toLocaleTimeString()}] {s.type}: {JSON.stringify(s.payload)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '100px' }}>
              Select an incident from the feed to view details and signals.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
