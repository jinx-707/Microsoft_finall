import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import AlertDetail from './pages/AlertDetail';
import Messages from './pages/Messages';
import AdminActions from './pages/AdminActions';
import Login from './pages/Login';
import Users from './pages/Users';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';
import { getAllAlertsForAdmin } from './services/api.js';

function App() {
  const [alerts, setAlerts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    by_type: { SOS: 0, INCIDENT: 0, GENERAL: 0 }
  });
  const [newAlertId, setNewAlertId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('token');
  });

  // Fetch real data from backend - includes SOS and incidents from their native endpoints
  // This ensures data sent from Android app via /api/sos and /api/incidents is visible
  const fetchData = useCallback(async () => {
    try {
      console.log('🔄 Fetching alerts from backend...');
      
      // Fetch from combined endpoint (fetches from /api/sos/user, /api/incidents/user, and /api/messages/admin/all)
      const data = await getAllAlertsForAdmin();
      
      // Safely extract messages array with defensive check
      const messagesList = Array.isArray(data?.messages) ? data.messages : [];
      const statsData = data?.stats || {};

      setMessages(messagesList);

      // Convert messages to alerts format for Dashboard/Alerts pages - handle missing fields
      const alertsList = messagesList.map(msg => ({
        id: msg.id || `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userName: msg.user_name || 'Unknown User',
        alertType: msg.message_type === 'SOS' ? 'SOS Alert' : msg.message_type === 'INCIDENT' ? 'Incident' : 'Message',
        userCategory: msg.ability || msg.category || 'Normal',
        isVulnerable: msg.ability && msg.ability !== 'NONE',
        timestamp: msg.created_at || new Date().toISOString(),
        status: msg.is_read ? 'Resolved' : 'Active',
        description: msg.content || msg.title || 'No description',
        riskScore: msg.severity === 'critical' ? 95 : msg.severity === 'high' ? 75 : msg.severity === 'medium' ? 50 : 25,
        location: msg.lat && msg.lng ? `${Number(msg.lat).toFixed(4)}, ${Number(msg.lng).toFixed(4)}` : null,
        category: msg.category,
        severity: msg.severity,
        ability: msg.ability,
        battery: msg.battery,
      }));
      
      setAlerts(alertsList);
      console.log(`✅ Loaded ${alertsList.length} alerts from backend`);

      // Use stats from combined data with defensive checks
      setStats({
        total: statsData.total || alertsList.length,
        unread: statsData.unread || alertsList.filter(m => !m.is_read).length,
        by_type: statsData.by_type || {
          SOS: alertsList.filter(m => m.alertType === 'SOS Alert').length,
          INCIDENT: alertsList.filter(m => m.alertType === 'Incident').length,
          GENERAL: alertsList.filter(m => m.alertType === 'Message').length,
        }
      });

    } catch (error) {
      console.error('❌ Error fetching data from backend:', error);
      // Set empty data on error to prevent crash
      setMessages([]);
      setAlerts([]);
      setStats({ total: 0, unread: 0, by_type: { SOS: 0, INCIDENT: 0, GENERAL: 0 } });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn, fetchData]);

  // Refresh data periodically
  useEffect(() => {
    if (!isLoggedIn) return;

    const interval = setInterval(() => {
      console.log('🔄 Periodic refresh...');
      fetchData();
    }, 10000); // Refresh every 10 seconds for real-time updates

    return () => clearInterval(interval);
  }, [isLoggedIn, fetchData]);

  const handleLogin = (success) => {
    if (success) {
      setIsLoggedIn(true);
      fetchData();
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="flex w-full min-h-screen bg-gray-100">
        <Sidebar unreadCount={stats.unread} />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading data from backend...</p>
                  <p className="mt-2 text-sm text-gray-500">Fetching SOS alerts and incidents...</p>
                </div>
              </div>
            ) : (
              <Routes>
                <Route
                  path="/"
                  element={<Dashboard alerts={alerts} stats={stats} newAlertId={newAlertId} />}
                />
                <Route
                  path="/alerts"
                  element={<Alerts alerts={alerts} newAlertId={newAlertId} />}
                />
                <Route
                  path="/alerts/:id"
                  element={<AlertDetail alerts={alerts} />}
                />
                <Route
                  path="/messages"
                  element={<Messages />}
                />
                <Route
                  path="/admin-actions"
                  element={<AdminActions />}
                />
                <Route path="/users" element={<Users />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            )}
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;

