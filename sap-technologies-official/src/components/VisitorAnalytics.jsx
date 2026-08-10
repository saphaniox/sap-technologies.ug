import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import "../styles/VisitorAnalytics.css";

const toArray = (value) => Array.isArray(value) ? value : [];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const createEmptyAnalytics = () => ({
  overview: {
    totalSessions: 0,
    uniqueVisitors: 0,
    totalPageViews: 0,
    avgSessionDuration: 0,
    avgPageViewsPerSession: 0,
    bounceRate: 0
  },
  topPages: [],
  topCountries: [],
  browserStats: [],
  osStats: [],
  deviceStats: [],
  referrerStats: [],
  recentSessions: [],
  sessionsByDay: []
});

const normalizeAnalytics = (data) => {
  const overview = data?.overview || {};

  return {
    overview: {
      totalSessions: toNumber(overview.totalSessions),
      uniqueVisitors: toNumber(overview.uniqueVisitors),
      totalPageViews: toNumber(overview.totalPageViews),
      avgSessionDuration: toNumber(overview.avgSessionDuration),
      avgPageViewsPerSession: toNumber(overview.avgPageViewsPerSession),
      bounceRate: toNumber(overview.bounceRate)
    },
    topPages: toArray(data?.topPages),
    topCountries: toArray(data?.topCountries),
    browserStats: toArray(data?.browserStats),
    osStats: toArray(data?.osStats),
    deviceStats: toArray(data?.deviceStats),
    referrerStats: toArray(data?.referrerStats),
    recentSessions: toArray(data?.recentSessions),
    sessionsByDay: toArray(data?.sessionsByDay)
  };
};

const normalizeLiveVisitors = (data) => {
  const sessions = toArray(data?.sessions);

  return {
    count: toNumber(data?.count, sessions.length),
    sessions
  };
};

const getBrowserName = (session) => session?.userAgent?.browser || "Unknown";

const VisitorAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [liveVisitors, setLiveVisitors] = useState({ count: 0, sessions: [] });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState(null);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/visitor-analytics?period=${period}`, { useCache: false });
      
      if (response.success) {
        setAnalytics(normalizeAnalytics(response.data));
        setError(null);
      } else {
        setAnalytics(createEmptyAnalytics());
        setError(response.message || "Failed to load analytics data");
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      setAnalytics(createEmptyAnalytics());
      setError(err.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [period]);

  // Fetch live visitors
  const fetchLiveVisitors = useCallback(async () => {
    try {
      const response = await api.get("/admin/visitor-analytics/live", { useCache: false });
      
      if (response.success) {
        setLiveVisitors(normalizeLiveVisitors(response.data));
      }
    } catch (err) {
      console.error("Failed to fetch live visitors:", err);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    fetchLiveVisitors();

    // Refresh live visitors every 30 seconds
    const liveInterval = setInterval(fetchLiveVisitors, 30000);

    return () => clearInterval(liveInterval);
  }, [fetchAnalytics, fetchLiveVisitors]);

  // Export analytics
  const handleExport = async (type) => {
    try {
      const params = new URLSearchParams({ period, type });
      const token = api.getStoredAuthToken?.() || "";
      const response = await fetch(
        `${api.baseURL}/api/admin/visitor-analytics/export?${params}`,
        {
          credentials: "include",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Export failed with status ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${type}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to export:", err);
      alert("Failed to export data");
    }
  };

  const formatDuration = (seconds) => {
    const safeSeconds = Math.max(0, toNumber(seconds));
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
  };

  if (loading && !analytics) {
    return (
      <div className="visitor-analytics">
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  const safeAnalytics = analytics || createEmptyAnalytics();
  const safeLiveVisitors = normalizeLiveVisitors(liveVisitors);
  const maxSessions = Math.max(1, ...safeAnalytics.sessionsByDay.map(day => toNumber(day.sessions)));
  const maxCountries = Math.max(1, ...safeAnalytics.topCountries.map(country => toNumber(country.count)));
  const maxSources = Math.max(1, ...safeAnalytics.referrerStats.map(source => toNumber(source.count)));

  return (
    <div className="visitor-analytics">
      <div className="analytics-header">
        <h2>📊 Visitor Analytics</h2>
        
        <div className="header-controls">
          <div className="period-selector">
            <button
              className={period === "24h" ? "active" : ""}
              onClick={() => setPeriod("24h")}
            >
              24 Hours
            </button>
            <button
              className={period === "7d" ? "active" : ""}
              onClick={() => setPeriod("7d")}
            >
              7 Days
            </button>
            <button
              className={period === "30d" ? "active" : ""}
              onClick={() => setPeriod("30d")}
            >
              30 Days
            </button>
            <button
              className={period === "90d" ? "active" : ""}
              onClick={() => setPeriod("90d")}
            >
              90 Days
            </button>
          </div>

          <div className="export-buttons">
            <button onClick={() => handleExport("sessions")}>
              📥 Export Sessions
            </button>
            <button onClick={() => handleExport("pageviews")}>
              📥 Export Page Views
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error">
          <span>{error}</span>
          <button type="button" onClick={fetchAnalytics} className="refresh-btn">
            Retry
          </button>
        </div>
      )}

      {/* Live Visitors */}
      <div className="live-visitors-banner">
        <div className="live-indicator">
          <span className="pulse"></span>
          <strong>{safeLiveVisitors.count}</strong> visitors online now
        </div>
        <button onClick={fetchLiveVisitors} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {/* Overview Cards */}
      {safeAnalytics && (
        <>
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-value">{safeAnalytics.overview.totalSessions.toLocaleString()}</div>
                <div className="stat-label">Total Sessions</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✨</div>
              <div className="stat-content">
                <div className="stat-value">{safeAnalytics.overview.uniqueVisitors.toLocaleString()}</div>
                <div className="stat-label">Unique Visitors</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📄</div>
              <div className="stat-content">
                <div className="stat-value">{safeAnalytics.overview.totalPageViews.toLocaleString()}</div>
                <div className="stat-label">Page Views</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-content">
                <div className="stat-value">{formatDuration(safeAnalytics.overview.avgSessionDuration)}</div>
                <div className="stat-label">Avg. Session</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">{safeAnalytics.overview.avgPageViewsPerSession}</div>
                <div className="stat-label">Pages/Session</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">↩️</div>
              <div className="stat-content">
                <div className="stat-value">{safeAnalytics.overview.bounceRate}%</div>
                <div className="stat-label">Bounce Rate</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="analytics-tabs">
            <button
              className={activeTab === "overview" ? "active" : ""}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={activeTab === "pages" ? "active" : ""}
              onClick={() => setActiveTab("pages")}
            >
              Top Pages
            </button>
            <button
              className={activeTab === "geography" ? "active" : ""}
              onClick={() => setActiveTab("geography")}
            >
              Geography
            </button>
            <button
              className={activeTab === "technology" ? "active" : ""}
              onClick={() => setActiveTab("technology")}
            >
              Technology
            </button>
            <button
              className={activeTab === "sources" ? "active" : ""}
              onClick={() => setActiveTab("sources")}
            >
              Traffic Sources
            </button>
            <button
              className={activeTab === "live" ? "active" : ""}
              onClick={() => setActiveTab("live")}
            >
              Live Sessions
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === "overview" && (
              <div className="overview-charts">
                <div className="chart-card">
                  <h3>Sessions Over Time</h3>
                  <div className="timeline-chart">
                    {safeAnalytics.sessionsByDay.map((day, index) => (
                      <div key={index} className="timeline-bar">
                        <div
                          className="bar"
                          style={{
                            height: `${(toNumber(day.sessions) / maxSessions) * 100}%`
                          }}
                          title={`${day.date}: ${day.sessions} sessions`}
                        ></div>
                        <div className="bar-label">{new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="chart-card">
                  <h3>Recent Sessions</h3>
                  <div className="sessions-table">
                    <table>
                      <thead>
                        <tr>
                          <th>IP Address</th>
                          <th>Location</th>
                          <th>Browser</th>
                          <th>First Seen</th>
                          <th>Pages</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {safeAnalytics.recentSessions.slice(0, 10).map((session, index) => (
                          <tr key={index}>
                            <td>{session.ipAddress}</td>
                            <td>{session.location?.country || 'Unknown'}</td>
                            <td>{getBrowserName(session)}</td>
                            <td>{formatDate(session.firstSeen)}</td>
                            <td>{session.pageViews}</td>
                            <td>{formatDuration(session.duration)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "pages" && (
              <div className="pages-list">
                <h3>Top Pages</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Page</th>
                      <th>Views</th>
                      <th>Avg. Time</th>
                      <th>Avg. Scroll</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeAnalytics.topPages.map((page, index) => (
                      <tr key={index}>
                        <td>{page.path}</td>
                        <td>{toNumber(page.views).toLocaleString()}</td>
                        <td>{formatDuration(page.avgTimeOnPage)}</td>
                        <td>{page.avgScrollDepth}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "geography" && (
              <div className="geography-stats">
                <h3>Top Countries</h3>
                <div className="country-list">
                  {safeAnalytics.topCountries.map((country, index) => (
                    <div key={index} className="country-item">
                      <div className="country-name">{country.country}</div>
                      <div className="country-bar">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${(toNumber(country.count) / maxCountries) * 100}%`
                          }}
                        ></div>
                      </div>
                      <div className="country-count">{country.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "technology" && (
              <div className="technology-stats">
                <div className="tech-section">
                  <h3>Browsers</h3>
                  <div className="tech-list">
                    {safeAnalytics.browserStats.map((browser, index) => (
                      <div key={index} className="tech-item">
                        <span>{browser.browser || "Unknown"}</span>
                        <span className="tech-count">{browser.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="tech-section">
                  <h3>Operating Systems</h3>
                  <div className="tech-list">
                    {safeAnalytics.osStats.map((os, index) => (
                      <div key={index} className="tech-item">
                        <span>{os.os || "Unknown"}</span>
                        <span className="tech-count">{os.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="tech-section">
                  <h3>Devices</h3>
                  <div className="tech-list">
                    {safeAnalytics.deviceStats.map((device, index) => (
                      <div key={index} className="tech-item">
                        <span>{device.device || 'Desktop'}</span>
                        <span className="tech-count">{device.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "sources" && (
              <div className="sources-stats">
                <h3>Traffic Sources</h3>
                <div className="sources-list">
                  {safeAnalytics.referrerStats.map((source, index) => (
                    <div key={index} className="source-item">
                      <div className="source-name">{source.source}</div>
                      <div className="source-bar">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${(toNumber(source.count) / maxSources) * 100}%`
                          }}
                        ></div>
                      </div>
                      <div className="source-count">{source.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "live" && (
              <div className="live-sessions">
                <h3>Live Sessions ({safeLiveVisitors.count})</h3>
                <table>
                  <thead>
                    <tr>
                      <th>IP Address</th>
                      <th>Location</th>
                      <th>Browser</th>
                      <th>Last Seen</th>
                      <th>Pages</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeLiveVisitors.sessions.map((session, index) => (
                      <tr key={index}>
                        <td>{session.ipAddress}</td>
                        <td>{session.location?.country || 'Unknown'}</td>
                        <td>{getBrowserName(session)}</td>
                        <td>{formatDate(session.lastSeen)}</td>
                        <td>{session.pageViews}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VisitorAnalytics;
