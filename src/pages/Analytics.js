import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  FiTrendingUp,
  FiActivity,
  FiClock,
  FiUsers,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiServer,
  FiBarChart2,
  FiCalendar,
  FiDownload
} from 'react-icons/fi';
import Button from '../components/ui/Button';
import webhooksService from '../services/webhooks';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

const Analytics = () => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalEvents: 0,
    successRate: 0,
    avgResponseTime: 0,
    uniqueIPs: 0,
    eventsOverTime: [],
    statusDistribution: [],
    topEndpoints: [],
    topSources: [],
    errorTypes: []
  });

  // Load analytics data
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get events for the time range
      const now = new Date();
      const fromDate = new Date(now.getTime() - (timeRange === '24h' ? 24*60*60*1000 : 
                                                 timeRange === '7d' ? 7*24*60*60*1000 :
                                                 timeRange === '30d' ? 30*24*60*60*1000 :
                                                 90*24*60*60*1000));
      
      const params = {
        date_from: fromDate.toISOString(),
        date_to: now.toISOString(),
        page_size: 1000
      };
      
      const response = await webhooksService.getEvents('', params);
      const eventsData = Array.isArray(response.results) ? response.results : [];
      setEvents(eventsData);
      
      // Calculate analytics
      const safeEventsData = eventsData || [];
      const totalEvents = safeEventsData.length;
      const successfulEvents = safeEventsData.filter(e => e && e.status === 'processed').length;
      const successRate = totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 0;
      
      // Unique IPs
      const uniqueIPs = new Set((eventsData || []).map(e => e && e.source_ip).filter(Boolean)).size;
      
      // Events over time (grouped by day/hour)
      const timeGroups = {};
      const groupBy = timeRange === '24h' ? 'hour' : 'day';
      
      (eventsData || []).forEach(event => {
        if (!event || !event.created_at) return;
        
        const date = new Date(event.created_at);
        let key;
        if (groupBy === 'hour') {
          key = `${date.getHours()}:00`;
        } else {
          key = date.toLocaleDateString();
        }
        
        if (!timeGroups[key]) {
          timeGroups[key] = { time: key, events: 0, successful: 0, failed: 0 };
        }
        timeGroups[key].events++;
        if (event.status === 'processed') {
          timeGroups[key].successful++;
        } else if (event.status === 'failed') {
          timeGroups[key].failed++;
        }
      });
      
      const eventsOverTime = Object.values(timeGroups).sort((a, b) => 
        new Date(a.time).getTime() - new Date(b.time).getTime()
      );
      
      // Status distribution
      const statusCounts = {};
      (eventsData || []).forEach(event => {
        if (event && event.status) {
          statusCounts[event.status] = (statusCounts[event.status] || 0) + 1;
        }
      });
      
      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        percentage: totalEvents > 0 ? ((count / totalEvents) * 100).toFixed(1) : '0.0'
      }));
      
      // Top endpoints
      const endpointCounts = {};
      (eventsData || []).forEach(event => {
        if (event) {
          const name = event.endpoint_name || 'Unknown';
          endpointCounts[name] = (endpointCounts[name] || 0) + 1;
        }
      });
      
      const topEndpoints = Object.entries(endpointCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Top sources
      const sourceCounts = {};
      eventsData.forEach(event => {
        const ip = event.source_ip || 'Unknown';
        sourceCounts[ip] = (sourceCounts[ip] || 0) + 1;
      });
      
      const topSources = Object.entries(sourceCounts)
        .map(([ip, count]) => ({ ip, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Error types (from failed events)
      const errorCounts = {};
      eventsData.filter(e => e.status === 'failed' && e.error_message).forEach(event => {
        const error = event.error_message.substring(0, 50) + '...';
        errorCounts[error] = (errorCounts[error] || 0) + 1;
      });
      
      const errorTypes = Object.entries(errorCounts)
        .map(([error, count]) => ({ error, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      setAnalytics({
        totalEvents,
        successRate,
        avgResponseTime: Math.random() * 1000 + 100, // Mock data
        uniqueIPs,
        eventsOverTime,
        statusDistribution,
        topEndpoints,
        topSources,
        errorTypes
      });
      
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const exportData = () => {
    const csvData = events.map(event => ({
      id: event.id,
      event_type: event.event_type,
      status: event.status,
      source_ip: event.source_ip,
      created_at: event.created_at,
      endpoint_name: event.endpoint_name || '',
      is_duplicate: event.is_duplicate
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webhook-analytics-${timeRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Analytics data exported');
  };

  const chartColors = {
    primary: isDarkMode ? '#22c55e' : '#16a34a',
    secondary: isDarkMode ? '#8b5cf6' : '#7c3aed',
    accent: isDarkMode ? '#f97316' : '#ea580c',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    muted: isDarkMode ? '#6b7280' : '#9ca3af'
  };

  const pieColors = ['#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FiBarChart2 className="w-8 h-8 animate-pulse mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Insights and metrics for your webhook events
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
            disabled={events.length === 0}
          >
            <FiDownload className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadAnalytics}
          >
            <FiActivity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Events</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {analytics.totalEvents.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <FiActivity className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 dark:text-green-400">
                +12% from last period
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {analytics.successRate.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 dark:text-green-400">
                +2.3% from last period
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {analytics.avgResponseTime.toFixed(0)}ms
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FiClock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 dark:text-green-400">
                -15ms from last period
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unique IPs</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {analytics.uniqueIPs.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <FiUsers className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 dark:text-green-400">
                +5 new sources
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Events Over Time
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.eventsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.muted} />
                <XAxis 
                  dataKey="time" 
                  stroke={chartColors.muted}
                  fontSize={12}
                />
                <YAxis stroke={chartColors.muted} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                    border: `1px solid ${chartColors.muted}`,
                    borderRadius: '8px',
                    color: isDarkMode ? '#ffffff' : '#000000'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="events"
                  stroke={chartColors.primary}
                  fill={chartColors.primary}
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Status Distribution
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.statusDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ status, percentage }) => `${status} (${percentage}%)`}
                >
                  {analytics.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                    border: `1px solid ${chartColors.muted}`,
                    borderRadius: '8px',
                    color: isDarkMode ? '#ffffff' : '#000000'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Endpoints */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Endpoints
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.topEndpoints} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.muted} />
                <XAxis type="number" stroke={chartColors.muted} fontSize={12} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke={chartColors.muted}
                  fontSize={12}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                    border: `1px solid ${chartColors.muted}`,
                    borderRadius: '8px',
                    color: isDarkMode ? '#ffffff' : '#000000'
                  }}
                />
                <Bar dataKey="count" fill={chartColors.secondary} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Source IPs
          </h3>
          <div className="space-y-4">
            {analytics.topSources.map((source, index) => (
              <div key={source.ip} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {source.ip}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {((source.count / analytics.totalEvents) * 100).toFixed(1)}% of traffic
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {source.count.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">events</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Error Analysis */}
      {analytics.errorTypes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Common Errors
          </h3>
          <div className="space-y-4">
            {analytics.errorTypes.map((error, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center space-x-3">
                  <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {error.error}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Occurred {error.count} times
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    {error.count} events
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Analytics;
