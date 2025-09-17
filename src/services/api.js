import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const getToken = () => {
  return localStorage.getItem('access_token') || Cookies.get('access_token');
};

const setToken = (token) => {
  localStorage.setItem('access_token', token);
  Cookies.set('access_token', token, { expires: 1 }); // 1 day
};

const removeToken = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
};

const getRefreshToken = () => {
  return localStorage.getItem('refresh_token') || Cookies.get('refresh_token');
};

const setRefreshToken = (token) => {
  localStorage.setItem('refresh_token', token);
  Cookies.set('refresh_token', token, { expires: 7 }); // 7 days
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const newToken = response.data.access;
          setToken(newToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        removeToken();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export { getToken, setToken, removeToken, getRefreshToken, setRefreshToken };
export default api;
