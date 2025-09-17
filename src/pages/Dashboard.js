import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiGlobe, 
  FiActivity, 
  FiTrendingUp, 
  FiUsers,
  FiPlus,
  FiArrowUpRight,
  FiArrowDownRight,
  FiClock,
  FiZap
} from 'react-icons/fi';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import webhooksService from '../services/webhooks';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEndpoints: 0,
    totalDeliveries: 0,
    totalEvents: 0,
    activeEndpoints: 0,
    todayEvents: 0,
    averageResponseTime: 0,
    successRate: 0,
  });
  const [recentEndpoints, setRecentEndpoints] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [chartData, setChartData] = useState({
    eventsOverTime: [],
    statusDistribution: [],
    endpointActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch endpoints
        const endpoints = await webhooksService.getEndpoints();
        setRecentEndpoints(endpoints.results?.slice(0, 5) || []);
        
        // Fetch recent events
        const events = await webhooksService.getEvents('');
        const eventsData = events.results || [];
        setRecentEvents(eventsData.slice(0, 10));
        
        // Calculate stats
        const totalEndpoints = endpoints.results?.length || 0;
        const activeEndpoints = endpoints.results?.filter(e => e.status === 'active').length || 0;
        const totalDeliveries = endpoints.results?.reduce((sum, e) => sum + (e.deliveries_count || 0), 0) || 0;
        const totalEvents = endpoints.results?.reduce((sum, e) => sum + (e.events_count || 0), 0) || 0;
        
        // Calculate today's events
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEvents = eventsData.filter(event => 
          new Date(event.created_at) >= today
        ).length;
        
        // Calculate success rate
        const processedEvents = eventsData.filter(e => e.status === 'processed').length;
        const successRate = eventsData.length > 0 ? Math.round((processedEvents / eventsData.length) * 100) : 0;
        
        setStats({
          totalEndpoints,
          totalDeliveries,
          totalEvents,
          activeEndpoints,
          todayEvents,
          averageResponseTime: Math.round(Math.random() * 200 + 50), // Simulated
          successRate,
        });
        
        // Prepare chart data
        prepareChartData(eventsData, endpoints.results || []);
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    const prepareChartData = (events, endpoints) => {
      // Ensure arrays are defined
      const safeEvents = events || [];
      const safeEndpoints = endpoints || [];
      
      // Events over time (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });
      
      const eventsOverTime = last7Days.map(date => {
        const dayEvents = safeEvents.filter(event => 
          event && event.created_at && event.created_at.startsWith(date)
        );
        return {
          date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          events: dayEvents.length,
          processed: dayEvents.filter(e => e && e.status === 'processed').length,
          failed: dayEvents.filter(e => e && e.status === 'failed').length,
        };
      });
      
      // Status distribution
      const statusCounts = safeEvents.reduce((acc, event) => {
        if (event && event.status) {
          acc[event.status] = (acc[event.status] || 0) + 1;
        }
        return acc;
      }, {});
      
      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        color: getStatusColor(status),
      }));
      
      // Endpoint activity
      const endpointActivity = safeEndpoints.slice(0, 5).map(endpoint => {
        if (!endpoint || !endpoint.id || !endpoint.name) {
          return {
            name: 'Unknown Endpoint',
            events: 0,
            success: 0,
          };
        }
        
        const endpointEvents = safeEvents.filter(e => e && e.endpoint === endpoint.id);
        return {
          name: endpoint.name.length > 15 ? endpoint.name.slice(0, 15) + '...' : endpoint.name,
          events: endpointEvents.length,
          success: endpointEvents.filter(e => e && e.status === 'processed').length,
        };
      });
      
      setChartData({
        eventsOverTime,
        statusDistribution,
        endpointActivity,
      });
    };

    const getStatusColor = (status) => {
      const colors = {
        new: '#3B82F6',
        processing: '#F59E0B',
        processed: '#10B981',
        failed: '#EF4444',
        forwarded: '#8B5CF6',
      };
      return colors[status] || '#6B7280';
    };

    fetchDashboardData();
    
    // Set up real-time updates
    const interval = setInterval(fetchDashboardData, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      title: 'Total Endpoints',
      value: stats.totalEndpoints,
      icon: FiGlobe,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      change: '+12%',
      changeType: 'increase',
    },
    {
      title: 'Active Endpoints',
      value: stats.activeEndpoints,
      icon: FiActivity,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      change: '+8%',
      changeType: 'increase',
    },
    {
      title: 'Today\'s Events',
      value: stats.todayEvents,
      icon: FiClock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      change: '+24%',
      changeType: 'increase',
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: FiZap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      change: '+16%',
      changeType: 'increase',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.first_name || 'User'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's what's happening with your webhook endpoints
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<FiPlus />}
          onClick={() => window.location.href = '/webhooks'}
        >
          Create Webhook
        </Button>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  {stat.changeType === 'increase' ? (
                    <FiArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <FiArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                    from last month
                  </span>
                </div>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events Over Time Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Events Over Time (Last 7 Days)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.eventsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="#6B7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6B7280"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="processed"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  stackId="1"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.8}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Event Status Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {chartData.statusDistribution.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Recent Activity and Endpoint Activity */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Events
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/events'}
            >
              View All
            </Button>
          </div>
          
          {recentEvents.length > 0 ? (
            <div className="space-y-3">
              {recentEvents.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      event.status === 'processed' ? 'bg-green-500' :
                      event.status === 'failed' ? 'bg-red-500' :
                      event.status === 'processing' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {event.event_type}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {event.time_ago}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    event.status === 'processed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : event.status === 'failed'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {event.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiActivity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No recent events
              </p>
            </div>
          )}
        </div>

        {/* Endpoint Activity Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Endpoints by Activity
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.endpointActivity} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  type="number"
                  stroke="#6B7280"
                  fontSize={12}
                />
                <YAxis 
                  type="category"
                  dataKey="name"
                  stroke="#6B7280"
                  fontSize={12}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Bar dataKey="events" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
