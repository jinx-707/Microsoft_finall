import React, { useState, useEffect } from 'react';
import { Wifi, Database, Cloud, Brain } from 'lucide-react';
import { getSystemHealth } from '../services/api.js';

function SystemHealthStrip() {
  const [health, setHealth] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const healthData = await getSystemHealth();
        setHealth(healthData);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error fetching system health:', error);
      }
    };

    // Initial fetch
    fetchHealth();

    // Update every 30 seconds
    const interval = setInterval(fetchHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!health) {
    return (
      <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Loading system status...</span>
          </div>
        </div>
      </div>
    );
  }

  const getServiceIcon = (serviceName) => {
    switch (serviceName.toLowerCase()) {
      case 'azure functions':
        return <Cloud className="h-4 w-4" />;
      case 'cosmos db':
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'notification hub':
        return <Wifi className="h-4 w-4" />;
      case 'machine learning':
      case 'ai services':
        return <Brain className="h-4 w-4" />;
      default:
        return <Cloud className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Operational':
        return 'text-green-600 bg-green-100';
      case 'Degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'Down':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* System Status */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${health.overall === 'Operational' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium text-gray-700">
              System: {health.overall}
            </span>
          </div>

          {/* Service Status */}
          <div className="hidden lg:flex items-center space-x-4">
            {health.services.slice(0, 4).map((service, index) => (
              <div key={index} className="flex items-center space-x-1">
                {getServiceIcon(service.name)}
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(service.status)}`}>
                  {service.name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Last Update */}
        <div className="text-xs text-gray-500">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

export default SystemHealthStrip;
