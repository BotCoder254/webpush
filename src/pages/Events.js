import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiActivity, 
  FiSearch, 
  FiFilter, 
  FiRefreshCw,
  FiPlay,
  FiPause,
  FiEye,
  FiCode,
  FiCalendar,
  FiMonitor,
  FiX,
  FiCopy,
  FiRepeat,
  FiSend,
  FiDownload,
  FiChevronDown,
  FiChevronRight,
  FiMaximize2,
  FiMinimize2,
  FiTag,
  FiSave,
  FiTrash2,
  FiCheckSquare,
  FiSquare,
  FiClock,
  FiWifi,
  FiWifiOff
} from 'react-icons/fi';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import JsonViewer from '../components/ui/JsonViewer';
import webhooksService from '../services/webhooks';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';

// Custom Virtualized List Component
const VirtualizedList = ({ items, itemHeight, renderItem, height = 600 }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Ensure items is always an array
  const safeItems = Array.isArray(items) ? items : [];
  
  const visibleCount = Math.ceil(height / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, safeItems.length);
  
  const visibleItems = safeItems.slice(startIndex, endIndex);
  const totalHeight = safeItems.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  return (
    <div 
      ref={containerRef}
      style={{ height, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            return (
              <div key={item?.id || actualIndex} style={{ height: itemHeight }}>
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Error Boundary Component
class EventsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Events Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <FiX className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              There was an error loading the events. Please try refreshing the page.
            </p>
            <Button 
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.reload();
              }}
            >
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const Events = () => {
  const { isDarkMode } = useTheme();
  const [events, setEvents] = useState([]);
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    endpoint_id: '',
    is_duplicate: '',
    date_from: '',
    date_to: ''
  });
  const [savedFilters, setSavedFilters] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isLiveFeed, setIsLiveFeed] = useState(false);
  const [liveMuted, setLiveMuted] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState(new Set());
  const [showReplayModal, setShowReplayModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [replayTarget, setReplayTarget] = useState('');
  const [forwardTarget, setForwardTarget] = useState('');
  const [tags, setTags] = useState({});
  const [newTag, setNewTag] = useState('');
  const [pagination, setPagination] = useState({
    hasNextPage: true,
    nextCursor: null,
    count: 0
  });

  // Real-time WebSocket connection
  const wsRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Load data with comprehensive validation
  const loadEvents = useCallback(async (cursor = null, append = false) => {
    try {
      setLoading(!append);
      const params = { ...filters };
      if (cursor) params.cursor = cursor;
      
      const response = await webhooksService.getEvents('', params);
      
      // Comprehensive data validation
      let eventsData = [];
      if (response && typeof response === 'object') {
        if (Array.isArray(response.results)) {
          eventsData = response.results;
        } else if (Array.isArray(response)) {
          eventsData = response;
        }
      }
      
      // Validate each event object
      const validatedEvents = eventsData
        .filter(event => event && typeof event === 'object' && event.id)
        .map(event => ({
          id: event.id || `temp-${Date.now()}-${Math.random()}`,
          event_type: event.event_type || 'Unknown',
          status: event.status || 'unknown',
          created_at: event.created_at || new Date().toISOString(),
          source_ip: event.source_ip || 'Unknown',
          data: event.data || {},
          raw_body: event.raw_body || '',
          raw_headers: event.raw_headers || {},
          content_type: event.content_type || 'application/json',
          user_agent: event.user_agent || 'Unknown',
          request_id: event.request_id || null,
          error_message: event.error_message || null,
          body_size: event.body_size || 0,
          is_duplicate: event.is_duplicate || false,
          processed_at: event.processed_at || null,
          signature: event.signature || null,
          endpoint: event.endpoint || null,
          endpoint_id: event.endpoint_id || null,
          endpoint_name: event.endpoint_name || 'Unknown Endpoint',
          time_ago: event.time_ago || 'Just now',
          replays: event.replays || [],
          forwards: event.forwards || []
        }));
      
      if (append) {
        setEvents(prev => [...prev, ...validatedEvents]);
      } else {
        setEvents(validatedEvents);
      }
      
      setPagination({
        hasNextPage: !!response?.next,
        nextCursor: response?.next ? new URL(response.next).searchParams.get('cursor') : null,
        count: response?.count || eventsData.length || 0
      });
    } catch (error) {
      console.error('Failed to load events:', error);
      toast.error('Failed to load events');
      // Set empty state on error
      setEvents([]);
      setPagination({
        hasNextPage: false,
        nextCursor: null,
        count: 0
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadEndpoints = useCallback(async () => {
    try {
      const response = await webhooksService.getEndpoints();
      setEndpoints(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to load endpoints:', error);
    }
  }, []);

  useEffect(() => {
    loadEvents();
    loadEndpoints();
  }, [loadEvents, loadEndpoints]);

  // WebSocket for real-time updates
  useEffect(() => {
    if (!isLiveFeed || liveMuted) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/events/`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setWsConnected(true);
        toast.success('Live feed connected');
      };
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'new_event' && !liveMuted) {
          setEvents(prev => [data.event, ...prev]);
          toast.success(`New event: ${data.event.event_type}`, {
            duration: 3000,
            position: 'top-right'
          });
        }
      };
      
      wsRef.current.onclose = () => {
        setWsConnected(false);
      };
      
      wsRef.current.onerror = () => {
        setWsConnected(false);
        toast.error('Live feed connection failed');
      };
    } catch (error) {
      console.error('WebSocket error:', error);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isLiveFeed, liveMuted]);

  // Load more events
  const loadMoreEvents = () => {
    if (pagination.hasNextPage && !loading) {
      loadEvents(pagination.nextCursor, true);
    }
  };

  // Event handlers
  const handleEventSelect = (eventId) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const handleEventInspect = async (eventId) => {
    try {
      const event = await webhooksService.getEventDetail(eventId);
      setSelectedEvent(event);
      setDrawerOpen(true);
    } catch (error) {
      toast.error('Failed to load event details');
    }
  };

  const handleReplay = async () => {
    if (!replayTarget || selectedEvents.size === 0) return;
    
    try {
      const promises = Array.from(selectedEvents).map(eventId =>
        webhooksService.replayEvent(eventId, { target_url: replayTarget })
      );
      
      await Promise.all(promises);
      toast.success(`Replayed ${selectedEvents.size} events`);
      setShowReplayModal(false);
      setReplayTarget('');
      setSelectedEvents(new Set());
    } catch (error) {
      toast.error('Failed to replay events');
    }
  };

  const handleForward = async () => {
    if (!forwardTarget || selectedEvents.size === 0) return;
    
    try {
      const promises = Array.from(selectedEvents).map(eventId =>
        webhooksService.forwardEvent(eventId, { target_url: forwardTarget })
      );
      
      await Promise.all(promises);
      toast.success(`Forwarded ${selectedEvents.size} events`);
      setShowForwardModal(false);
      setForwardTarget('');
      setSelectedEvents(new Set());
    } catch (error) {
      toast.error('Failed to forward events');
    }
  };

  const handleAddTag = async (eventId, tag) => {
    try {
      // This would be an API call in a real implementation
      setTags(prev => ({
        ...prev,
        [eventId]: [...(prev[eventId] || []), tag]
      }));
      toast.success('Tag added');
    } catch (error) {
      toast.error('Failed to add tag');
    }
  };

  const handleRemoveTag = async (eventId, tag) => {
    try {
      setTags(prev => ({
        ...prev,
        [eventId]: (prev[eventId] || []).filter(t => t !== tag)
      }));
      toast.success('Tag removed');
    } catch (error) {
      toast.error('Failed to remove tag');
    }
  };

  const handleSaveFilter = () => {
    const filterName = prompt('Enter filter name:');
    if (filterName) {
      setSavedFilters(prev => [...prev, { name: filterName, filters }]);
      toast.success('Filter saved');
    }
  };

  const handleApplyFilter = (savedFilter) => {
    setFilters(savedFilter.filters);
    setShowFilters(false);
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      processed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      forwarded: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.new}`}>
        {status}
      </span>
    );
  };

  // Event row component for custom virtualized list
  const EventRow = React.memo(({ event, index }) => {
    try {
      // Validate event data
      if (!event || typeof event !== 'object' || !event.id) {
        return (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        );
      }

      const isSelected = selectedEvents.has(event.id);
    
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex items-center space-x-4 p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${
          isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''
        }`}
      >
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleEventSelect(event.id)}
            className="text-gray-500 hover:text-primary-600"
          >
            {isSelected ? <FiCheckSquare className="w-4 h-4" /> : <FiSquare className="w-4 h-4" />}
          </button>
          <div className="text-sm text-gray-500 dark:text-gray-400 min-w-[80px]">
            {event.created_at ? new Date(event.created_at).toLocaleTimeString() : 'Unknown'}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-gray-900 dark:text-white">{event.event_type || 'Unknown Event'}</span>
            <StatusBadge status={event.status || 'unknown'} />
            {event.is_duplicate && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                Duplicate
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
            {event.preview_body || 
             (event.data && typeof event.data === 'object' ? JSON.stringify(event.data).slice(0, 120) : 
              event.raw_body ? event.raw_body.slice(0, 120) : 'No preview available')}
          </div>
          <div className="flex items-center space-x-4 mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              IP: {event.source_ip || 'Unknown'}
            </span>
            {event.time_ago && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {event.time_ago}
              </span>
            )}
          </div>
          {tags[event.id] && tags[event.id].length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags[event.id].map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                >
                  <FiTag className="w-3 h-3 mr-1" />
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(event.id, tag)}
                    className="ml-1 text-gray-500 hover:text-red-500"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEventInspect(event.id)}
            className="text-gray-500 hover:text-primary-600"
          >
            <FiEye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedEvents(new Set([event.id]));
              setShowReplayModal(true);
            }}
            className="text-gray-500 hover:text-primary-600"
          >
            <FiRepeat className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
      );
    } catch (error) {
      console.error('Error rendering event row:', error);
      return (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <p className="text-red-500 text-sm">Error loading event</p>
          </div>
        </div>
      );
    }
  }, [selectedEvents, tags, handleEventSelect]);

  return (
    <EventsErrorBoundary>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Event Logs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage your webhook events
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Live feed toggle */}
          <div className="flex items-center space-x-2">
            <Button
              variant={isLiveFeed ? "default" : "outline"}
              size="sm"
              onClick={() => setIsLiveFeed(!isLiveFeed)}
              className="flex items-center space-x-2"
            >
              {wsConnected ? <FiWifi className="w-4 h-4" /> : <FiWifiOff className="w-4 h-4" />}
              <span>Live</span>
            </Button>
            {isLiveFeed && (
              <Button
                variant={liveMuted ? "outline" : "ghost"}
                size="sm"
                onClick={() => setLiveMuted(!liveMuted)}
              >
                {liveMuted ? <FiPause className="w-4 h-4" /> : <FiPlay className="w-4 h-4" />}
              </Button>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadEvents()}
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <FiActivity className="w-5 h-5 text-primary-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Events</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {pagination.count?.toLocaleString() || events.length}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <FiCheckSquare className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Selected</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {selectedEvents.size}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <FiClock className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Last 24h</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {events.filter(e => new Date(e.created_at) > new Date(Date.now() - 24*60*60*1000)).length}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <FiWifi className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Live Status</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {wsConnected ? 'Connected' : 'Offline'}
          </p>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedEvents.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg border border-primary-200 dark:border-primary-800"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-primary-700 dark:text-primary-300 font-medium">
                {selectedEvents.size} events selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEvents(new Set())}
                className="text-primary-600 hover:text-primary-700"
              >
                Clear selection
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReplayModal(true)}
                className="flex items-center space-x-2"
              >
                <FiRepeat className="w-4 h-4" />
                <span>Replay</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForwardModal(true)}
                className="flex items-center space-x-2"
              >
                <FiSend className="w-4 h-4" />
                <span>Forward</span>
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveFilter}
                >
                  <FiSave className="w-4 h-4 mr-2" />
                  Save Filter
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                >
                  <FiX className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Input
                label="Search"
                placeholder="Search events..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                icon={FiSearch}
              />
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="new">New</option>
                  <option value="processing">Processing</option>
                  <option value="processed">Processed</option>
                  <option value="failed">Failed</option>
                  <option value="forwarded">Forwarded</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Endpoint
                </label>
                <select
                  value={filters.endpoint_id}
                  onChange={(e) => setFilters({ ...filters, endpoint_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Endpoints</option>
                  {endpoints.map(endpoint => (
                    <option key={endpoint.id} value={endpoint.id}>
                      {endpoint.name}
                    </option>
                  ))}
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
            
            {/* Saved Filters */}
            {savedFilters.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Saved Filters
                </h4>
                <div className="flex flex-wrap gap-2">
                  {savedFilters.map((savedFilter, index) => (
                    <button
                      key={index}
                      onClick={() => handleApplyFilter(savedFilter)}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                    >
                      {savedFilter.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({
                    search: '',
                    status: '',
                    endpoint_id: '',
                    is_duplicate: '',
                    date_from: '',
                    date_to: ''
                  });
                }}
              >
                Clear
              </Button>
              <Button onClick={() => loadEvents()}>
                Apply Filters
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="h-[600px]">
          {events.length > 0 ? (
            <div>
              <VirtualizedList
                items={events}
                itemHeight={120}
                height={600}
                renderItem={(event, index) => {
                  return <EventRow event={event} index={index} />;
                }}
              />
              {pagination.hasNextPage && (
                <div className="p-4 text-center">
                  <Button
                    onClick={loadMoreEvents}
                    disabled={loading}
                    variant="outline"
                  >
                    {loading ? 'Loading...' : 'Load More Events'}
                  </Button>
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FiRefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Loading events...</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FiActivity className="w-8 h-8 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No events found</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Drawer */}
      <AnimatePresence>
        {drawerOpen && selectedEvent && selectedEvent.id && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setDrawerOpen(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white dark:bg-gray-900 shadow-xl overflow-hidden"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Event Details
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {selectedEvent.event_type} • {selectedEvent.time_ago}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(selectedEvent, null, 2));
                        toast.success('Event data copied to clipboard');
                      }}
                    >
                      <FiCopy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(selectedEvent, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `event-${selectedEvent.id}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <FiDownload className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDrawerOpen(false)}
                    >
                      <FiX className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                    {/* Left: JSON Viewer */}
                    <div className="border-r border-gray-200 dark:border-gray-700">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-medium text-gray-900 dark:text-white">Payload</h3>
                      </div>
                      <div className="p-4">
                        <JsonViewer
                          data={(() => {
                            try {
                              if (selectedEvent?.data && typeof selectedEvent.data === 'object') {
                                return selectedEvent.data;
                              }
                              if (selectedEvent?.raw_body) {
                                return JSON.parse(selectedEvent.raw_body);
                              }
                              return {};
                            } catch (e) {
                              return { raw_body: selectedEvent?.raw_body || 'No data available' };
                            }
                          })()}
                          collapsed={false}
                          copyable={true}
                        />
                      </div>
                    </div>

                    {/* Right: Metadata and Actions */}
                    <div className="p-4 space-y-6">
                      {/* Metadata */}
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-4">Metadata</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">ID</span>
                            <span className="text-sm font-mono text-gray-900 dark:text-white">
                              {selectedEvent.id}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Endpoint</span>
                            <span className="text-sm text-gray-900 dark:text-white">
                              {selectedEvent.endpoint_name}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Source IP</span>
                            <span className="text-sm font-mono text-gray-900 dark:text-white">
                              {selectedEvent.source_ip}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                            <StatusBadge status={selectedEvent.status} />
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Size</span>
                            <span className="text-sm text-gray-900 dark:text-white">
                              {selectedEvent.body_size} bytes
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Headers */}
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-4">Headers</h3>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 max-h-48 overflow-auto">
                          <JsonViewer
                            data={selectedEvent?.raw_headers && typeof selectedEvent.raw_headers === 'object' ? selectedEvent.raw_headers : {}}
                            collapsed={true}
                            copyable={true}
                          />
                        </div>
                      </div>

                      {/* Tags */}
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-4">Tags</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {(tags[selectedEvent.id] || []).map(tag => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            >
                              <FiTag className="w-3 h-3 mr-1" />
                              {tag}
                              <button
                                onClick={() => handleRemoveTag(selectedEvent.id, tag)}
                                className="ml-1 text-gray-500 hover:text-red-500"
                              >
                                <FiX className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Add tag..."
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && newTag.trim()) {
                                handleAddTag(selectedEvent.id, newTag.trim());
                                setNewTag('');
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              if (newTag.trim()) {
                                handleAddTag(selectedEvent.id, newTag.trim());
                                setNewTag('');
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-4">Actions</h3>
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => {
                              setSelectedEvents(new Set([selectedEvent.id]));
                              setShowReplayModal(true);
                            }}
                          >
                            <FiRepeat className="w-4 h-4 mr-2" />
                            Replay Event
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => {
                              setSelectedEvents(new Set([selectedEvent.id]));
                              setShowForwardModal(true);
                            }}
                          >
                            <FiSend className="w-4 h-4 mr-2" />
                            Forward Event
                          </Button>
                        </div>
                      </div>

                      {/* Replay/Forward History */}
                      {(selectedEvent.replays?.length > 0 || selectedEvent.forwards?.length > 0) && (
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white mb-4">History</h3>
                          <div className="space-y-2">
                            {selectedEvent.replays?.map(replay => (
                              <div key={replay.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    Replay to {replay.target_url}
                                  </span>
                                  <StatusBadge status={replay.status} />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {new Date(replay.created_at).toLocaleString()}
                                </p>
                              </div>
                            ))}
                            {selectedEvent.forwards?.map(forward => (
                              <div key={forward.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    Forward to {forward.target_url}
                                  </span>
                                  <StatusBadge status={forward.status} />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {new Date(forward.created_at).toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Replay Modal */}
      <AnimatePresence>
        {showReplayModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Replay Events
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Replay {selectedEvents.size} selected event(s) to a new URL.
              </p>
              <Input
                label="Target URL"
                placeholder="https://api.example.com/webhook"
                value={replayTarget}
                onChange={(e) => setReplayTarget(e.target.value)}
                className="mb-4"
              />
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReplayModal(false);
                    setReplayTarget('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReplay}
                  disabled={!replayTarget}
                >
                  Replay Events
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forward Modal */}
      <AnimatePresence>
        {showForwardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Forward Events
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Forward {selectedEvents.size} selected event(s) to a new URL.
              </p>
              <Input
                label="Target URL"
                placeholder="https://api.example.com/webhook"
                value={forwardTarget}
                onChange={(e) => setForwardTarget(e.target.value)}
                className="mb-4"
              />
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForwardModal(false);
                    setForwardTarget('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleForward}
                  disabled={!forwardTarget}
                >
                  Forward Events
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </EventsErrorBoundary>
  );
};

export default Events;