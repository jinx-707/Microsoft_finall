
/**
 * SenseSafe API Service
 * Connected to FastAPI backend via Vite proxy
 */

import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://sensesafe-c9c8bpend7cceeh7.eastasia-01.azurewebsites.net',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

const simulateError = (probability = 0) => {
  if (Math.random() < probability) {
    throw new Error('Network error occurred');
  }
};

// ==================== AUTHENTICATION ====================

/**
 * Authenticate user
 * @param {Object} credentials - Login credentials {email, password}
 * @returns {Promise<Object>} Authentication response
 */
export const authenticateUser = async (credentials) => {
  simulateError(0.05);

  try {
    const response = await apiClient.post('/api/auth/login', credentials);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      return {
        success: true,
        token: response.data.access_token,
        user: response.data.user,
      };
    }
    throw new Error('Invalid response from server');
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Register new user
 * @param {Object} userData - User registration data {name, email, password, role, ability}
 * @returns {Promise<Object>} Registration response
 */
export const registerUser = async (userData) => {
  simulateError(0.05);

  try {
    const response = await apiClient.post('/api/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Get current user profile
 * @returns {Promise<Object>} User profile
 */
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
};

/**
 * Get all users (Admin only)
 * @param {Object} params - Query parameters {page, page_size, search}
 * @returns {Promise<Object>} List of users
 */
export const getAllUsers = async (params = {}) => {
  try {
    const response = await apiClient.get('/api/admin/users', {
      params: {
        page: params.page || 1,
        page_size: params.page_size || 50,
        search: params.search || null,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Get all users error:', error);
    throw error;
  }
};

// ==================== SOS ALERTS ====================

/**
 * Send SOS alert to backend
 * @param {Object} sosData - SOS alert data {ability, lat, lng, battery, status}
 * @returns {Promise<Object>} Created SOS alert
 */
export const sendSOS = async (sosData) => {
  simulateError(0.05);

  try {
    console.log('📡 Sending SOS to backend:', sosData);
    const response = await apiClient.post('/api/sos', {
      ability: sosData.ability || 'NONE',
      lat: sosData.lat,
      lng: sosData.lng,
      battery: sosData.battery || 100,
      status: sosData.status || 'NEED_HELP',
    });
    console.log('✅ SOS sent successfully:', response.data);
    return {
      success: true,
      message: 'SOS sent successfully',
      data: response.data,
    };
  } catch (error) {
    console.error('❌ SOS send error:', error);
    throw error;
  }
};

/**
 * Get user's SOS alerts
 * @returns {Promise<Array>} List of user's SOS alerts
 */
export const getUserSOSAlerts = async () => {
  try {
    const response = await apiClient.get('/api/sos/user');
    return response.data.sos_alerts || [];
  } catch (error) {
    console.error('Get SOS alerts error:', error);
    throw error;
  }
};

/**
 * Get all SOS alerts (admin)
 * @returns {Promise<Array>} List of all SOS alerts
 */
export const getAllSOSAlerts = async () => {
  try {
    // Use admin SOS endpoint first
    const response = await apiClient.get('/api/admin/sos', {
      params: { page_size: 100 }
    });
    return response.data.sos_alerts || [];
  } catch (error) {
    console.warn('Could not fetch SOS from admin endpoint, trying fallback...');
    // Fallback: try user endpoint
    try {
      const response = await apiClient.get('/api/sos/user');
      return response.data.sos_alerts || [];
    } catch (e) {
      console.warn('No SOS data available');
      return [];
    }
  }
};

/**
 * Get SOS statistics (active SOS count)
 * @returns {Promise<Object>} Active SOS count
 */
export const getSOSStats = async () => {
  try {
    const response = await apiClient.get('/api/admin/stats/sos');
    return response.data;
  } catch (error) {
    console.error('Get SOS stats error:', error);
    return { active_sos: 0 };
  }
};

/**
 * Get map data (incidents + SOS markers)
 * @returns {Promise<Object>} Map data with incidents and sos_alerts arrays
 */
export const getMapData = async () => {
  try {
    const response = await apiClient.get('/api/admin/map-data');
    return response.data;
  } catch (error) {
    console.error('Get map data error:', error);
    return { incidents: [], sos_alerts: [] };
  }
};

// ==================== INCIDENTS ====================

/**
 * Send incident report to backend
 * @param {Object} incidentData - Incident report data {title, content, category, severity, lat, lng, image_url}
 * @returns {Promise<Object>} Created incident
 */
export const sendIncident = async (incidentData) => {
  simulateError(0.05);

  try {
    console.log('📡 Sending incident to backend:', incidentData);
    const response = await apiClient.post('/api/incidents', {
      title: incidentData.title || `Incident Report: ${incidentData.category}`,
      content: incidentData.content,
      category: incidentData.category,
      severity: incidentData.severity,
      lat: incidentData.lat,
      lng: incidentData.lng,
      image_url: incidentData.image_url || null,
    });
    console.log('✅ Incident sent successfully:', response.data);
    return {
      success: true,
      message: 'Incident reported successfully',
      data: response.data,
    };
  } catch (error) {
    console.error('❌ Incident send error:', error);
    throw error;
  }
};

/**
 * Get user's incident reports
 * @returns {Promise<Array>} List of user's incidents
 */
export const getUserIncidents = async () => {
  try {
    const response = await apiClient.get('/api/incidents/user');
    return response.data.incidents || [];
  } catch (error) {
    console.error('Get incidents error:', error);
    throw error;
  }
};

/**
 * Get incident by ID
 * @param {string} incidentId - Incident ID
 * @returns {Promise<Object>} Incident details
 */
export const getIncidentById = async (incidentId) => {
  try {
    const response = await apiClient.get(`/api/incidents/${incidentId}`);
    return response.data;
  } catch (error) {
    console.error('Get incident error:', error);
    throw error;
  }
};

/**
 * Get all incidents (admin)
 * @param {Object} params - Query parameters {page, page_size, status_filter}
 * @returns {Promise<Object>} Paginated list of incidents
 */
export const getAdminIncidents = async (params = {}) => {
  try {
    const response = await apiClient.get('/api/admin/incidents', {
      params: {
        page: params.page || 1,
        page_size: params.page_size || 100,
        status_filter: params.status_filter || null,
      },
    });
    return response.data.incidents || [];
  } catch (error) {
    console.error('Get admin incidents error:', error);
    throw error;
  }
};

/**
 * Get all incidents from incidents endpoint (bypasses messages table)
 * This is the key function to fetch incidents sent from Android app
 * @returns {Promise<Array>} List of all incidents
 */
export const getAllIncidentsDirect = async () => {
  try {
    // Use admin incidents endpoint first
    const response = await apiClient.get('/api/admin/incidents', {
      params: { page_size: 100 }
    });
    return response.data.incidents || [];
  } catch (error) {
    console.warn('Could not fetch incidents from admin endpoint, trying fallback...');
    // Fallback: try user endpoint
    try {
      const response = await apiClient.get('/api/incidents/user');
      return response.data.incidents || [];
    } catch (e) {
      console.warn('No incidents available from any endpoint');
      return [];
    }
  }
};

// ==================== DISASTER ALERTS ====================

/**
 * Get all disaster alerts
 * @param {Object} params - Query parameters {page, page_size}
 * @returns {Promise<Object>} Paginated list of alerts
 */
export const getAlerts = async (params = {}) => {
  try {
    const response = await apiClient.get('/api/alerts', {
      params: {
        page: params.page || 1,
        page_size: params.page_size || 20,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Get alerts error:', error);
    throw error;
  }
};

// ==================== ADMIN DASHBOARD - COMBINED FETCH ====================

/**
 * Get all alerts for admin dashboard
 * 
 * Priority order:
 * 1. Use data from /api/messages/admin/all (has real UUIDs for mark-as-read)
 * 2. Fall back to SOS/incidents endpoints only if messages is empty
 * 
 * Backend Response Format:
 * - GET /api/messages/admin/all: { messages: [{ id, user_id, user_name, message_type, title, content, ... }] }
 * - GET /api/sos/user: { sos_alerts: [{ id, user_id, ability, lat, lng, battery, status, created_at }] }
 * - GET /api/incidents/user: { incidents: [{ id, user_id, type, description, lat, lng, status, image_url, risk_score, risk_level, created_at }] }
 */
/**
 * Get all alerts for admin dashboard
 * 
 * Fetches data from ALL sources (Messages, SOS, Incidents) and merges them.
 * This ensures we don't miss any data depending on which endpoint created it.
 */
export const getAllAlertsForAdmin = async () => {
  try {
    console.log('🔄 Fetching all alerts from backend (Unified Mode)...');

    // Fetch all sources in parallel
    const [messagesRes, sosRes, incidentsRes] = await Promise.allSettled([
      apiClient.get('/api/messages/admin/all', { params: { page_size: 100 } }),
      apiClient.get('/api/sos/user'),
      apiClient.get('/api/incidents/user')
    ]);

    // Extract data from responses
    const messages = messagesRes.status === 'fulfilled' && messagesRes.value.data?.messages
      ? messagesRes.value.data.messages
      : [];

    const sosAlerts = sosRes.status === 'fulfilled' && sosRes.value.data?.sos_alerts
      ? sosRes.value.data.sos_alerts
      : [];

    const incidents = incidentsRes.status === 'fulfilled' && incidentsRes.value.data?.incidents
      ? incidentsRes.value.data.incidents
      : [];

    console.log(`📊 Raw Counts - Messages: ${messages.length}, SOS: ${sosAlerts.length}, Incidents: ${incidents.length}`);

    // Helper to check if an entity is already represented in messages
    // We assume if a message has type INCIDENT and title/content matches, it might be the same.
    // Ideally, we'd check IDs, but they differ.
    // For now, we will simply create a "Unified Feed" where we prioritize "Messages" (since they are the 'inbox')
    // BUT we must allow Incidents/SOS that aren't in messages to show up.

    // Strategy:
    // 1. Map Messages to common format.
    // 2. Map SOS to common format.
    // 3. Map Incidents to common format.
    // 4. Combine all. 
    // 5. (Optional) Deduplication? 
    //    Risk of duplicates is real if creating an Incident also creates a Message.
    //    Current Backend analysis: Incident creation -> No Message. SOS creation -> No Message.
    //    Message creation -> Creates Message (and maybe records elsewhere but those endpoints aren't used by frontend).
    //    So NO DEDUPLICATION needed for now based on current backend logic.

    // Format Messages
    const formattedMessages = messages.map(msg => ({
      ...msg,
      id: msg.id, // KEEP ORIGINAL UUID
      sourceType: 'MESSAGE', // detailed type
      // Ensure specific fields
      is_read: Boolean(msg.is_read)
    }));

    // Format SOS
    const formattedSOS = sosAlerts.map(sos => ({
      id: sos.id, // KEEP ORIGINAL UUID
      message_type: 'SOS',
      sourceType: 'SOS', // detailed type
      user_name: 'Unknown User', // SOS endpoint doesn't return user name? check schema? Schema has user_id, no name.
      user_id: sos.user_id,
      title: `SOS Alert (${sos.ability || 'Unknown'})`,
      content: `Emergency SOS - Status: ${sos.status}`,
      ability: sos.ability || 'NONE',
      battery: sos.battery,
      lat: sos.lat,
      lng: sos.lng,
      severity: 'critical',
      is_read: sos.status === 'SAFE', // Map SAFE status to Read/Resolved
      created_at: sos.created_at,
      status: sos.status,
      // Add special flag to help UI know how to resolve
      _backendId: sos.id
    }));

    // Format Incidents
    const formattedIncidents = incidents.map(inc => ({
      id: inc.id, // KEEP ORIGINAL UUID
      message_type: 'INCIDENT',
      sourceType: 'INCIDENT', // detailed type
      user_name: 'Unknown User',
      user_id: inc.user_id,
      title: `Incident: ${inc.type}`,
      content: inc.description,
      category: inc.type,
      description: inc.description,
      severity: inc.risk_level?.toLowerCase() || 'medium',
      risk_score: inc.risk_score,
      risk_level: inc.risk_level,
      lat: inc.lat,
      lng: inc.lng,
      is_read: inc.status === 'RESOLVED' || inc.status === 'VERIFIED', // Map status to is_read
      created_at: inc.created_at,
      status: inc.status,
      image_url: inc.image_url,
      _backendId: inc.id
    }));

    // Combine all
    const allItems = [...formattedMessages, ...formattedSOS, ...formattedIncidents];

    // Sort by Date Descending
    allItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Stats
    const stats = {
      total: allItems.length,
      unread: allItems.filter(m => !m.is_read).length,
      sos_count: allItems.filter(m => m.message_type === 'SOS').length,
      incident_count: allItems.filter(m => m.message_type === 'INCIDENT').length,
      by_type: {
        SOS: allItems.filter(m => m.message_type === 'SOS').length,
        INCIDENT: allItems.filter(m => m.message_type === 'INCIDENT').length,
        GENERAL: allItems.filter(m => m.message_type === 'GENERAL').length,
      }
    };

    console.log(`✅ Returns ${allItems.length} consolidated items`);

    return {
      messages: allItems,
      stats
    };
  } catch (error) {
    console.error('Error fetching all alerts for admin:', error);
    return {
      messages: [],
      stats: { total: 0, unread: 0, sos_count: 0, incident_count: 0, by_type: { SOS: 0, INCIDENT: 0, GENERAL: 0 } }
    };
  }
};

/**
 * Resolve SOS Alert (Admin only)
 * @param {string} sosId - SOS ID
 * @returns {Promise<Object>} Updated SOS
 */
export const resolveSOS = async (sosId) => {
  try {
    const response = await apiClient.patch(`/api/admin/sos/${sosId}/resolve`);
    return response.data;
  } catch (error) {
    console.error('Resolve SOS error:', error);
    throw error;
  }
};

/**
 * Get all messages from all users (Admin only)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Paginated list of messages
 */
export const getAllMessages = async (params = {}) => {
  try {
    const response = await apiClient.get('/api/messages/admin/all', {
      params: {
        page: params.page || 1,
        page_size: params.page_size || 50,
        message_type: params.message_type || null,
        is_read: params.is_read || null,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Get all messages error:', error);
    throw error;
  }
};

/**
 * Get message statistics for admin dashboard
 * @returns {Promise<Object>} Message statistics
 */
export const getMessageStats = async () => {
  try {
    const response = await apiClient.get('/api/messages/admin/stats');
    return response.data;
  } catch (error) {
    console.error('Get message stats error:', error);
    // Return calculated stats from available data
    return { total: 0, unread: 0 };
  }
};

/**
 * Get unread message count (Admin only)
 * @returns {Promise<Object>} Unread count
 */
export const getUnreadCount = async () => {
  try {
    const response = await apiClient.get('/api/messages/admin/unread/count');
    return response.data;
  } catch (error) {
    console.error('Get unread count error:', error);
    throw error;
  }
};

/**
 * Mark message as read (Admin only)
 * @param {string} messageId - Message ID
 * @returns {Promise<Object>} Updated message
 */
export const markMessageAsRead = async (messageId) => {
  try {
    const response = await apiClient.post(`/api/messages/admin/${messageId}/read`);
    return response.data;
  } catch (error) {
    console.error('Mark message as read error:', error);
    throw error;
  }
};

/**
 * Verify incident (Admin only)
 * @param {string} incidentId - Incident ID
 * @returns {Promise<Object>} Updated incident
 */
export const verifyIncident = async (incidentId) => {
  try {
    const response = await apiClient.patch(`/api/admin/incidents/${incidentId}/verify`);
    return response.data;
  } catch (error) {
    console.error('Verify incident error:', error);
    throw error;
  }
};

/**
 * Resolve incident (Admin only)
 * @param {string} incidentId - Incident ID
 * @returns {Promise<Object>} Updated incident
 */
export const resolveIncident = async (incidentId) => {
  try {
    const response = await apiClient.patch(`/api/admin/incidents/${incidentId}/resolve`);
    return response.data;
  } catch (error) {
    console.error('Resolve incident error:', error);
    throw error;
  }
};

/**
 * Update incident (Admin only)
 * @param {string} incidentId - Incident ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated incident
 */
export const updateIncident = async (incidentId, updateData) => {
  try {
    const response = await apiClient.patch(`/api/admin/incidents/${incidentId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Update incident error:', error);
    throw error;
  }
};

// ==================== AUDIT LOGS ====================

/**
 * Get audit logs (Admin only)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Paginated audit logs
 */
export const getAuditLogs = async (params = {}) => {
  try {
    const response = await apiClient.get('/api/admin/audit-logs', {
      params: {
        page: params.page || 1,
        page_size: params.page_size || 50,
        action: params.action || null,
        resource_type: params.resource_type || null,
        admin_id: params.admin_id || null,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Get audit logs error:', error);
    throw error;
  }
};

/**
 * Get audit log statistics (Admin only)
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Object>} Audit log statistics
 */
export const getAuditStats = async (days = 7) => {
  try {
    const response = await apiClient.get('/api/admin/audit-logs/stats', {
      params: { days },
    });
    return response.data;
  } catch (error) {
    console.error('Get audit stats error:', error);
    throw error;
  }
};

/**
 * Create disaster alert (Admin only)
 * @param {Object} alertData - Alert data {title, message, severity}
 * @returns {Promise<Object>} Created alert
 */
export const createDisasterAlert = async (alertData) => {
  try {
    const response = await apiClient.post('/api/admin/alerts', alertData);
    return response.data;
  } catch (error) {
    console.error('Create disaster alert error:', error);
    throw error;
  }
};

// ==================== LEGACY FUNCTIONS ====================

/**
 * Get all SOS alerts (legacy)
 * @returns {Promise<Array>} Array of SOS alerts
 */
export const getSOS = async () => {
  try {
    return await getAllSOSAlerts();
  } catch (error) {
    console.warn('Backend not available, returning empty array');
    return [];
  }
};

/**
 * Get all incidents (legacy)
 * @returns {Promise<Array>} Array of incidents
 */
export const getIncidents = async () => {
  try {
    // This is the key fix - use direct endpoint that Android app uses
    const response = await getAllIncidentsDirect();
    return response;
  } catch (error) {
    console.warn('Backend not available, returning empty array');
    return [];
  }
};

/**
 * Send user status update
 * @param {Object} statusData - User status data
 * @returns {Promise<Object>} Response with success status
 */
export const sendUserStatus = async (statusData) => {
  try {
    return await sendIncident({
      title: 'Status Update',
      content: statusData.message || 'User status update',
      category: statusData.type || 'general',
      severity: statusData.severity || 'low',
      lat: statusData.lat,
      lng: statusData.lng,
    });
  } catch (error) {
    console.error('Send user status error:', error);
    throw error;
  }
};

/**
 * Get user profile by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User profile
 */
export const getUserProfile = async (userId) => {
  try {
    const response = await apiClient.get(`/api/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
};

/**
 * Get system health status
 * @returns {Promise<Object>} System health information
 */
export const getSystemHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    // Return mock data if backend not available
    return {
      status: 'healthy',
      service: 'SenseSafe',
      version: '1.0.0',
    };
  }
};

/**
 * Delete message (Admin only)
 * @param {string} messageId - Message ID
 * @returns {Promise<Object>} Response
 */
export const deleteMessage = async (messageId) => {
  try {
    const response = await apiClient.delete(`/api/messages/admin/${messageId}`);
    return response.data;
  } catch (error) {
    console.error('Delete message error:', error);
    throw error;
  }
};

/**
 * Resolve alert (Admin only)
 * @param {string} alertId - Alert ID
 * @returns {Promise<Object>} Response
 */
export const resolveAlert = async (alertId) => {
  try {
    const response = await apiClient.delete(`/api/alerts/${alertId}/resolve`);
    return response.data;
  } catch (error) {
    console.error('Resolve alert error:', error);
    throw error;
  }
};

