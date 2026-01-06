import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';

import { getAuditLogs, getAuditStats } from '../services/api.js';

function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    page: 1,
    pageSize: 50
  });

  const [total, setTotal] = useState(0);

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: filters.page,
        page_size: filters.pageSize
      };

      if (filters.action) {
        params.action = filters.action;
      }
      if (filters.resourceType) {
        params.resource_type = filters.resourceType;
      }

      const data = await getAuditLogs(params);
      setAuditLogs(data.audit_logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setError('Failed to load audit logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const data = await getAuditStats(7);
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch audit stats:', err);
    }
  };

  // Initial load and real-time updates
  useEffect(() => {
    fetchAuditLogs();
    fetchStats();

    const interval = setInterval(() => {
      // Only refresh if we are on the first page and have no active filters (optional, but good UX)
      // Actually, for "real time" we usually want to see new stuff. 
      // If the user has paged or filtered, auto-refresh might be annoying or lose context.
      // Let's just refresh stats always, and logs only if page===1
      fetchStats();
      if (filters.page === 1) {
        fetchAuditLogs();
      }
    }, 10000); // 10 seconds for real-time feel

    return () => clearInterval(interval);
  }, [filters]); // Re-setup interval if filters change, so we capture latest filter state in closure if needed, but fetchAuditLogs uses state...
  // Wait, if I depend on filters, then fetching inside interval needs access to fresh state.
  // Using a ref or just simple dependency is easier. actually fetchAuditLogs uses 'filters' state which is a closure capture issue if not careful.
  // But filters is in dependency array of the other useEffect.
  // Let's just create a separate effect for the interval that depends on `filters` to restart it, OR use a functional update pattern / ref.
  // Easiest is to add filters to dependency array here.




  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'action' || key === 'resourceType' ? 1 : prev.page
    }));
  };

  const handleRefresh = () => {
    fetchAuditLogs();
    fetchStats();
  };

  const getActionIcon = (action) => {
    if (action.includes('LOGIN') || action.includes('LOGOUT')) {
      return <User className="h-4 w-4 text-blue-500" />;
    }
    if (action.includes('VERIFY')) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (action.includes('RESOLVE')) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (action.includes('CREATE')) {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }
    if (action.includes('UPDATE')) {
      return <Activity className="h-4 w-4 text-purple-500" />;
    }
    if (action.includes('FAILED')) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (action.includes('VIEW')) {
      return <Search className="h-4 w-4 text-gray-500" />;
    }
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const formatAction = (action) => {
    return action.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const actionOptions = [
    { value: '', label: 'All Actions' },
    { value: 'VIEW_INCIDENTS', label: 'View Incidents' },
    { value: 'VERIFY_INCIDENT', label: 'Verify Incident' },
    { value: 'RESOLVE_INCIDENT', label: 'Resolve Incident' },
    { value: 'UPDATE_INCIDENT', label: 'Update Incident' },
    { value: 'CREATE_ALERT', label: 'Create Alert' },
    { value: 'LOGIN', label: 'Login' },
    { value: 'LOGOUT', label: 'Logout' },
    { value: 'FAILED_LOGIN', label: 'Failed Login' },
  ];

  const resourceTypeOptions = [
    { value: '', label: 'All Resources' },
    { value: 'INCIDENT', label: 'Incident' },
    { value: 'ALERT', label: 'Alert' },
    { value: 'AUTH', label: 'Authentication' },
    { value: 'AUDIT_LOG', label: 'Audit Log' },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-gray-600">Track all admin actions and changes</p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center px-4 py-2 border rounded hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-600">Total Actions (7 days)</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-600">Successful</div>
            <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-600">Failed</div>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-600">Success Rate</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.total > 0
                ? Math.round((stats.successful / stats.total) * 100)
                : 0}%
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-sm font-medium mr-2">Filters:</span>
          </div>

          <select
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          >
            {actionOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={filters.resourceType}
            onChange={(e) => handleFilterChange('resourceType', e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          >
            {resourceTypeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <div className="ml-auto text-sm text-gray-500">
            Showing {auditLogs.length} of {total} entries
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            Loading audit logs...
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Activity className="h-8 w-8 mx-auto mb-2" />
            No audit logs found
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Admin</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Resource</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Details</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      {getActionIcon(log.action)}
                      <span className="ml-2 text-sm font-medium">
                        {formatAction(log.action)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">{log.admin_email}</div>
                    <div className="text-xs text-gray-500">ID: {log.admin_id.slice(0, 8)}...</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">{log.resource_type}</div>
                    {log.resource_id && (
                      <div className="text-xs text-gray-500">ID: {log.resource_id.slice(0, 8)}...</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {log.details ? (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                          View Details
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                          {JSON.stringify(JSON.parse(log.details), null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {log.success ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Failed
                      </span>
                    )}
                    {log.error_message && (
                      <div className="text-xs text-red-500 mt-1">{log.error_message}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDate(log.created_at)}
                    </div>
                    {log.ip_address && (
                      <div className="text-xs text-gray-400">IP: {log.ip_address}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > filters.pageSize && (
        <div className="flex justify-center mt-6">
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange('page', filters.page - 1)}
              disabled={filters.page === 1 || loading}
              className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {filters.page} of {Math.ceil(total / filters.pageSize)}
            </span>
            <button
              onClick={() => handleFilterChange('page', filters.page + 1)}
              disabled={filters.page * filters.pageSize >= total || loading}
              className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditLogs;

