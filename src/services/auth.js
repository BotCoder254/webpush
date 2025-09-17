import api, { setToken, setRefreshToken, removeToken } from './api';

// Authentication service
class AuthService {
  async login(email, password) {
    try {
      const response = await api.post('/auth/login/', {
        email,
        password,
      });

      const { access, refresh, user } = response.data;
      
      setToken(access);
      setRefreshToken(refresh);
      
      return { user, token: access };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async register(userData) {
    try {
      const response = await api.post('/auth/register/', userData);
      
      const { access, refresh, user } = response.data;
      
      setToken(access);
      setRefreshToken(refresh);
      
      return { user, token: access };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout() {
    try {
      await api.post('/auth/logout/');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout error:', error);
    } finally {
      removeToken();
    }
  }

  async getProfile() {
    try {
      const response = await api.get('/auth/profile/');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateProfile(userData) {
    try {
      const response = await api.patch('/auth/profile/', userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async resetPassword(email) {
    try {
      const response = await api.post('/auth/password/reset/', { email });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async resetPasswordConfirm(data) {
    try {
      const response = await api.post('/auth/password/reset/confirm/', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async changePassword(data) {
    try {
      const response = await api.post('/auth/password/change/', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response?.data) {
      // Extract error messages from response
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

export default new AuthService();
