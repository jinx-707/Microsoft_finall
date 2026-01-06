import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Users,
  MessageCircle,
  Flame
} from 'lucide-react';

import { 
  getAllAlertsForAdmin,
  resolveSOS,
  resolveIncident,
  markMessageAsRead
} from '../services/api.js';

function AdminActions() {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    sos_count: 0,
    incident_count: 0
  });

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await getAllAlertsForAdmin();
      const alertsList = Array.isArray(data?.messages) ? data.messages : [];
      const statsData = data?.stats || {};

      setAlerts(alertsList);
      setStats({
        total: statsData.total || alertsList.length,
        unread: statsData.unread || alertsList.filter(a => !a.is_read).length,
        sos_count: statsData.by_type?.SOS || alertsList.filter(a => a.message_type === 'SOS').length,
        incident_count: statsData.by_type?.INCIDENT || alertsList.filter(a => a.message_type === 'INCIDENT').length
      });
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolve = async (alert) => {
    try {
      if (alert.message_type === 'SOS') {
        await resolveSOS(alert.id);
      } else if (alert.message_type === 'INCIDENT') {
        await resolveIncident(alert.id);
      }

      // Update local state
      setAlerts(prev =>
        prev.map(a =>
          a.id === alert.id 
            ? { ...a, is_read: true, status: alert.message_type === 'SOS' ? 'SAFE' : 'RESOLVED' }
            : a
        )
      );

      setStats(prev => ({
        ...prev,
        unread: Math.max(prev.unread - 1, 0)
      }));
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const handleMarkRead = async (alertId) => {
    try {
      await markMessageAsRead(alertId);
      
      setAlerts(prev =>
        prev.map(a =>
          a.id === alertId ? { ...a, is_read: true } : a
        )
      );

      setStats(prev => ({
        ...prev,
        unread: Math.max(prev.unread - 1, 0)
      }));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'SOS':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'INCIDENT':
        return <Flame className="h-5 w-5 text-orange-500" />;
      default:
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleString();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Actions</h1>
        <button
          onClick={fetchAlerts}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <MessageCircle className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">SOS Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.sos_count}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Flame className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Incidents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.incident_count}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unread</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unread}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Active Alerts</h2>
        </div>
        
        {isLoading ? (
          <div className="p-6 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-500" />
            <p className="mt-2 text-gray-600">Loading alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-6 text-center">
            <MessageCircle className="h-8 w-8 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-600">No alerts found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {alerts.slice(0, 10).map((alert) => (
              <div key={alert.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getAlertIcon(alert.message_type)}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {alert.title || `${alert.message_type} Alert`}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {alert.content || 'No description'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTimestamp(alert.created_at)} • {alert.user_name || 'Unknown User'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {alert.status && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        alert.status === 'SAFE' || alert.status === 'RESOLVED' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {alert.status}
                      </span>
                    )}
                    
                    {!alert.is_read && (
                      <button
                        onClick={() => handleMarkRead(alert.id)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Mark Read
                      </button>
                    )}
                    
                    {(alert.status !== 'SAFE' && alert.status !== 'RESOLVED') && (
                      <button
                        onClick={() => handleResolve(alert)}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminActions;
