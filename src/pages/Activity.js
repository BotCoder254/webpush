import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List } from 'react-window';
import {
  FiActivity,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiClock,
  FiUser,
  FiSettings,
  FiChevronDown,
  FiChevronRight,
  FiCalendar,
  FiGlobe,
  FiKey,
  FiRepeat,
  FiSend,
  FiShield,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiLogIn,
  FiLogOut,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiMail,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import JsonViewer from '../components/ui/JsonViewer';
import { useTheme } from '../contexts/ThemeContext';
import activityService from '../services/activity';
import toast from 'react-hot-toast';

const Activity = () => {
  const { isDarkMode } = useTheme();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    is_system: '',
    target_type: '',
    date_from: '',
    date_to: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedActivities, setExpandedActivities] = useState(new Set());
  const [newActivities, setNewActivities] = useState(0);
  const [showNewBanner, setShowNewBanner] = useState(false);
  const [pagination, setPagination] = useState({
    hasNextPage: true,
    nextCursor: null,
    count: 0
  });

  // Real-time WebSocket connection
  const wsRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Activity type icons mapping
  const getActivityIcon = (type) => {
    const iconMap = {
      'WEBHOOK_RECEIVED': FiMail,
      'WEBHOOK_CREATED': FiPlus,
      'WEBHOOK_UPDATED': FiEdit3,
      'WEBHOOK_DELETED': FiTrash2,
      'SECRET_ROTATED': FiKey,
      'REPLAY_TRIGGERED': FiRepeat,
      'REPLAY_SUCCESS': FiCheckCircle,
      'REPLAY_FAILED': FiXCircle,
      'FORWARD_TRIGGERED': FiSend,
      'FORWARD_SUCCESS': FiCheckCircle,
      'FORWARD_FAILED': FiXCircle,
      'LOGIN_SUCCESS': FiLogIn,
      'LOGIN_FAILED': FiAlertCircle,
      'LOGOUT': FiLogOut,
      'API_KEY_CREATED': FiKey,
      'API_KEY_DELETED': FiKey,
      'USER_REGISTERED': FiUser,
      'PASSWORD_CHANGED': FiShield,
      'PASSWORD_RESET': FiShield,
      'SYSTEM_ERROR': FiAlertCircle,
    };
    return iconMap[type] || FiActivity;
  };

  // Activity type colors
  const getActivityColor = (type) => {
    const colorMap = {
      'WEBHOOK_RECEIVED': 'text-blue-600 dark:text-blue-400',
      'WEBHOOK_CREATED': 'text-green-600 dark:text-green-400',
      'WEBHOOK_UPDATED': 'text-yellow-600 dark:text-yellow-400',
      'WEBHOOK_DELETED': 'text-red-600 dark:text-red-400',
      'SECRET_ROTATED': 'text-purple-600 dark:text-purple-400',
      'REPLAY_TRIGGERED': 'text-indigo-600 dark:text-indigo-400',
      'REPLAY_SUCCESS': 'text-green-600 dark:text-green-400',
      'REPLAY_FAILED': 'text-red-600 dark:text-red-400',
      'FORWARD_TRIGGERED': 'text-indigo-600 dark:text-indigo-400',
      'FORWARD_SUCCESS': 'text-green-600 dark:text-green-400',
      'FORWARD_FAILED': 'text-red-600 dark:text-red-400',
      'LOGIN_SUCCESS': 'text-green-600 dark:text-green-400',
      'LOGIN_FAILED': 'text-red-600 dark:text-red-400',
      'LOGOUT': 'text-gray-600 dark:text-gray-400',
      'API_KEY_CREATED': 'text-green-600 dark:text-green-400',
      'API_KEY_DELETED': 'text-red-600 dark:text-red-400',
      'USER_REGISTERED': 'text-blue-600 dark:text-blue-400',
      'PASSWORD_CHANGED': 'text-yellow-600 dark:text-yellow-400',
      'PASSWORD_RESET': 'text-yellow-600 dark:text-yellow-400',
      'SYSTEM_ERROR': 'text-red-600 dark:text-red-400',
    };
    return colorMap[type] || 'text-gray-600 dark:text-gray-400';
  };

  // Load activities
  const loadActivities = useCallback(async (cursor = null, append = false) => {
    try {
      setLoading(!append);
      const params = { ...filters };
      if (cursor) params.cursor = cursor;
      
      // Try to fetch from real API first
      try {
        console.log('Fetching activities from API with params:', params);
        const data = await activityService.getActivities(params);
        console.log('API response:', data);
        
        // Handle different response structures
        const results = data?.results || data || [];
        
        if (append && Array.isArray(results)) {
          setActivities(prev => [...prev, ...results]);
        } else if (Array.isArray(results)) {
          setActivities(results);
        } else {
          setActivities([]);
        }
        
        setPagination({
          hasNextPage: !!data?.next,
          nextCursor: data?.next ? new URL(data.next).searchParams.get('cursor') : null,
          count: data?.count || results.length || 0
        });
        
      } catch (apiError) {
        console.warn('API not available, using demo data:', apiError.message);
        
        // Only use demo data if the API is completely unavailable
        if (apiError.message.includes('Network error') || apiError.message.includes('Failed to fetch')) {
          const demoActivities = await generateDemoActivities();
          setActivities(demoActivities);
          setPagination({
            hasNextPage: false,
            nextCursor: null,
            count: demoActivities.length
          });
        } else {
          // For other errors (like 401, 403, etc.), show empty state
          setActivities([]);
          setPagination({
            hasNextPage: false,
            nextCursor: null,
            count: 0
          });
          toast.error('Failed to load activities: ' + apiError.message);
        }
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Generate demo activities for when API is not available
  const generateDemoActivities = async () => {
    const activityTypes = [
      'WEBHOOK_RECEIVED', 'SECRET_ROTATED', 'REPLAY_SUCCESS', 'LOGIN_SUCCESS', 
      'WEBHOOK_CREATED', 'REPLAY_FAILED', 'LOGIN_FAILED', 'FORWARD_SUCCESS'
    ];
    
    const demoActivities = [];
    const now = Date.now();
    
    for (let i = 0; i < 10; i++) {
      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const timeOffset = Math.floor(Math.random() * 24 * 60 * 60 * 1000); // Random time in last 24h
      
      demoActivities.push({
        id: `demo_${i + 1}`,
        type,
        title: activityService.getMockTitle(type),
        description: activityService.getMockDescription(type),
        actor_name: i % 3 === 0 ? 'System' : ['John Doe', 'Jane Smith', 'Admin'][Math.floor(Math.random() * 3)],
        is_system: type.includes('SYSTEM') || type.includes('WEBHOOK_RECEIVED'),
        created_at: new Date(now - timeOffset).toISOString(),
        time_ago: `${Math.floor(timeOffset / (1000 * 60))} minutes ago`,
        metadata: activityService.getMockMetadata(type)
      });
    }
    
    return demoActivities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // WebSocket for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/activity/`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setWsConnected(true);
      };
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'new_activity') {
          setNewActivities(prev => prev + 1);
          setShowNewBanner(true);
        }
      };
      
      wsRef.current.onclose = () => {
        setWsConnected(false);
      };
      
      wsRef.current.onerror = () => {
        setWsConnected(false);
      };
    } catch (error) {
      console.error('WebSocket error:', error);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Load more activities
  const loadMoreActivities = () => {
    if (pagination.hasNextPage && !loading) {
      loadActivities(pagination.nextCursor, true);
    }
  };

  // Toggle activity expansion
  const toggleExpanded = (activityId) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedActivities(newExpanded);
  };

  // Refresh activities
  const refreshActivities = () => {
    setNewActivities(0);
    setShowNewBanner(false);
    loadActivities();
  };

  // Activity row component
  const ActivityRow = ({ index, style }) => {
    const activity = activities[index];
    if (!activity || !activity.id) return <div style={style}>Loading...</div>;

    const Icon = getActivityIcon(activity.type || 'SYSTEM_ERROR');
    const isExpanded = expandedActivities.has(activity.id);
    const colorClass = getActivityColor(activity.type || 'SYSTEM_ERROR');
    
    return (
      <motion.div
        style={style}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="p-4 border-b border-gray-200 dark:border-gray-700"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
          onClick={() => toggleExpanded(activity.id)}
        >
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-full bg-gray-100 dark:bg-gray-700 ${colorClass}`}>
              <Icon className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {activity.title || 'Unknown Activity'}
                </h3>
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  <span title={activity.created_at ? new Date(activity.created_at).toLocaleString() : 'Unknown time'}>
                    {activity.time_ago || 'Unknown time'}
                  </span>
                  {isExpanded ? (
                    <FiChevronDown className="w-4 h-4" />
                  ) : (
                    <FiChevronRight className="w-4 h-4" />
                  )}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {activity.description || 'No description available'}
              </p>
              
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <FiUser className="w-3 h-3" />
                  <span>{activity.actor_name || 'Unknown'}</span>
                </div>
                {activity.is_system && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    System
                  </span>
                )}
              </div>
              
              {/* Expanded details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                  >
                    {activity.metadata && typeof activity.metadata === 'object' && Object.keys(activity.metadata).length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Details
                        </h4>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                          <JsonViewer
                            data={activity.metadata}
                            collapsed={false}
                            copyable={true}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-medium text-gray-500 dark:text-gray-400">ID:</span>
                        <p className="font-mono text-gray-900 dark:text-white">{activity.id}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500 dark:text-gray-400">Type:</span>
                        <p className="text-gray-900 dark:text-white">{activity.type}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Activity</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Timeline of system events and user actions
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshActivities}
            disabled={loading}
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter className="w-4 h-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* New Activities Banner */}
      <AnimatePresence>
        {showNewBanner && newActivities > 0 && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiActivity className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <span className="text-primary-700 dark:text-primary-300 font-medium">
                  {newActivities} new {newActivities === 1 ? 'activity' : 'activities'} — click to refresh
                </span>
              </div>
              <Button
                size="sm"
                onClick={refreshActivities}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                Refresh
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <FiActivity className="w-5 h-5 text-primary-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Activities</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {pagination.count?.toLocaleString() || activities.length}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <FiUser className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">User Actions</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {activities.filter(a => !a.is_system).length}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <FiSettings className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">System Events</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {activities.filter(a => a.is_system).length}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <FiClock className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Last 24h</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {activities.filter(a => new Date(a.created_at) > new Date(Date.now() - 24*60*60*1000)).length}
          </p>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Input
                label="Search"
                placeholder="Search activities..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                icon={FiSearch}
              />
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Activity Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Types</option>
                  <option value="WEBHOOK_RECEIVED">Webhook Received</option>
                  <option value="SECRET_ROTATED">Secret Rotated</option>
                  <option value="REPLAY_TRIGGERED">Replay Triggered</option>
                  <option value="LOGIN_SUCCESS">Login Success</option>
                  <option value="SYSTEM_ERROR">System Error</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Source
                </label>
                <select
                  value={filters.is_system}
                  onChange={(e) => setFilters({ ...filters, is_system: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Sources</option>
                  <option value="true">System Only</option>
                  <option value="false">User Only</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                label="From Date"
                type="datetime-local"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              />
              
              <Input
                label="To Date"
                type="datetime-local"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              />
            </div>
            
            <div className="flex items-center justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({
                    search: '',
                    type: '',
                    is_system: '',
                    target_type: '',
                    date_from: '',
                    date_to: ''
                  });
                }}
              >
                Clear
              </Button>
              <Button onClick={() => loadActivities()}>
                Apply Filters
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activities List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {activities.length > 0 ? (
          <div>
            <List
              height={800}
              itemCount={activities.length}
              itemSize={120}
            >
              {ActivityRow}
            </List>
            {pagination.hasNextPage && (
              <div className="p-4 text-center border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={loadMoreActivities}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? 'Loading...' : 'Load More Activities'}
                </Button>
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <FiRefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Loading activities...</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <FiActivity className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No activity yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Send a webhook or take an action to see it here.
                </p>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Activity;
