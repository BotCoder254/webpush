import api from './api';
import axios from 'axios';

// Webhooks service
class WebhooksService {
  async getEndpoints() {
    try {
      const response = await api.get('/webhooks/endpoints/');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getEndpoint(id) {
    try {
      const response = await api.get(`/webhooks/endpoints/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching webhook endpoint:', error);
      throw this.handleError(error);
    }
  }

  async createEndpoint(data) {
    try {
      const response = await api.post('/webhooks/endpoints/', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateEndpoint(id, data) {
    try {
      const response = await api.patch(`/webhooks/endpoints/${id}/`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteEndpoint(id) {
    try {
      await api.delete(`/webhooks/endpoints/${id}/`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async rotateSecret(id) {
    try {
      const response = await api.post(`/webhooks/endpoints/${id}/rotate_secret/`, {
        confirm: true,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getSecret(id) {
    try {
      const response = await api.get(`/webhooks/endpoints/${id}/secret/`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async testEndpoint(id, payload) {
    try {
      const response = await api.post(`/webhooks/endpoints/${id}/test/`, payload);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getDeliveries(id, params = {}) {
    try {
      const response = await api.get(`/webhooks/endpoints/${id}/deliveries/`, {
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getEvents(id = '', params = {}) {
    try {
      let url = '/webhooks/events/';
      if (id) {
        url = `/webhooks/endpoints/${id}/events/`;
      }
      const response = await api.get(url, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getWebhookAnalytics(id, params = {}) {
    try {
      const response = await api.get(`/webhooks/endpoints/${id}/analytics/`, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getDeliveryDetail(id) {
    try {
      const response = await api.get(`/webhooks/deliveries/${id}/`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getEventDetail(id) {
    try {
      const response = await api.get(`/webhooks/events/${id}/`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async replayEvent(eventId, data) {
    try {
      const response = await api.post(`/webhooks/events/${eventId}/replay/`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async forwardEvent(eventId, data) {
    try {
      const response = await api.post(`/webhooks/events/${eventId}/forward/`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getWebhookDebugData(pathToken) {
    if (!pathToken || pathToken === 'undefined') {
      throw new Error('Invalid path token provided');
    }
    
    try {
      // Use axios directly since debug endpoint is outside /api/ namespace
      const baseURL = process.env.REACT_APP_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000';
      const url = `${baseURL}/debug/webhook/${pathToken}/`;
      console.log('Making debug request to:', url);
      
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      
      console.log('Debug response status:', response.status);
      console.log('Debug response data keys:', Object.keys(response.data || {}));
      return response.data;
    } catch (error) {
      console.error('Debug service error:', error);
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response?.data) {
      const errorData = error.response.data;
      
      if (typeof errorData === 'string') {
        return new Error(errorData);
      }
      
      if (errorData.detail) {
        return new Error(errorData.detail);
      }
      
      if (errorData.message) {
        return new Error(errorData.message);
      }
      
      // Handle field-specific errors
      const fieldErrors = Object.entries(errorData)
        .filter(([key, value]) => Array.isArray(value))
        .map(([key, value]) => `${key}: ${value.join(', ')}`)
        .join('; ');
      
      if (fieldErrors) {
        return new Error(fieldErrors);
      }
    }
    
    return new Error(error.message || 'An unexpected error occurred');
  }
}

export default new WebhooksService();
