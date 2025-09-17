import api from './api';

class ActivityService {
  handleError(error) {
    if (error.response) {
      console.error('API Error:', error.response.data);
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      throw new Error(error.response.data.detail || error.response.data.message || 'An API error occurred');
    } else if (error.request) {
      console.error('Network Error:', error.request);
      throw new Error('Network error: No response from server.');
    } else {
      console.error('Error:', error.message);
      throw new Error(error.message);
    }
  }

  async getActivities(params = {}) {
    try {
      const response = await api.get('/activity/', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getActivityDetail(id) {
    try {
      const response = await api.get(`/activity/${id}/`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Mock activity creation for testing (remove in production)
  async createMockActivity(type = 'WEBHOOK_RECEIVED') {
    const mockActivity = {
      id: Date.now().toString(),
      type,
      title: this.getMockTitle(type),
      description: this.getMockDescription(type),
      actor_name: 'System',
      is_system: type.includes('SYSTEM') || type.includes('WEBHOOK_RECEIVED'),
      created_at: new Date().toISOString(),
      time_ago: 'Just now',
      metadata: this.getMockMetadata(type)
    };
    
    return mockActivity;
  }

  getMockTitle(type) {
    const titles = {
      'WEBHOOK_RECEIVED': 'Webhook received on Payment Endpoint',
      'SECRET_ROTATED': 'Secret rotated for API Webhook',
      'REPLAY_SUCCESS': 'Event replay succeeded',
      'REPLAY_FAILED': 'Event replay failed',
      'LOGIN_SUCCESS': 'User login successful',
      'LOGIN_FAILED': 'Login attempt failed',
      'WEBHOOK_CREATED': 'New webhook endpoint created',
      'WEBHOOK_UPDATED': 'Webhook endpoint updated',
      'WEBHOOK_DELETED': 'Webhook endpoint deleted',
      'FORWARD_SUCCESS': 'Event forward succeeded',
      'FORWARD_FAILED': 'Event forward failed',
      'SYSTEM_ERROR': 'System error occurred'
    };
    return titles[type] || 'Activity occurred';
  }

  getMockDescription(type) {
    const descriptions = {
      'WEBHOOK_RECEIVED': 'Payment successful webhook received from Stripe',
      'SECRET_ROTATED': 'Webhook secret was manually rotated for security',
      'REPLAY_SUCCESS': 'Payment event successfully replayed to backup endpoint',
      'REPLAY_FAILED': 'Failed to replay event to target endpoint',
      'LOGIN_SUCCESS': 'User successfully logged in to the dashboard',
      'LOGIN_FAILED': 'Failed login attempt detected',
      'WEBHOOK_CREATED': 'Created new webhook endpoint for user notifications',
      'WEBHOOK_UPDATED': 'Updated webhook endpoint configuration',
      'WEBHOOK_DELETED': 'Webhook endpoint was permanently deleted',
      'FORWARD_SUCCESS': 'Event successfully forwarded to external system',
      'FORWARD_FAILED': 'Failed to forward event to external system',
      'SYSTEM_ERROR': 'Internal system error encountered'
    };
    return descriptions[type] || 'System activity occurred';
  }

  getMockMetadata(type) {
    const metadata = {
      'WEBHOOK_RECEIVED': {
        ip_address: '192.168.1.1',
        event_type: 'payment.succeeded',
        amount: 2999,
        currency: 'USD',
        endpoint_name: 'Payment Endpoint'
      },
      'SECRET_ROTATED': {
        webhook_name: 'API Webhook',
        reason: 'Security rotation',
        previous_secret_age: '30 days'
      },
      'REPLAY_SUCCESS': {
        target_url: 'https://backup.example.com/webhook',
        response_code: 200,
        event_id: 'evt_123',
        retry_count: 1
      },
      'REPLAY_FAILED': {
        target_url: 'https://failed.example.com/webhook',
        error_code: 'TIMEOUT',
        event_id: 'evt_456',
        retry_count: 3
      },
      'LOGIN_SUCCESS': {
        ip_address: '203.0.113.42',
        user_agent: 'Mozilla/5.0 Chrome/91.0',
        session_id: 'sess_abc123',
        location: 'New York, US'
      },
      'LOGIN_FAILED': {
        ip_address: '198.51.100.42',
        user_agent: 'Suspicious Bot/1.0',
        failure_reason: 'Invalid credentials',
        attempt_count: 3
      },
      'WEBHOOK_CREATED': {
        webhook_name: 'User Notifications',
        status: 'active',
        endpoint_url: '/webhook/abc123'
      },
      'SYSTEM_ERROR': {
        error_type: 'DATABASE_CONNECTION',
        error_message: 'Connection timeout to primary database',
        affected_services: ['webhooks', 'auth']
      }
    };
    return metadata[type] || {};
  }
}

export default new ActivityService();
