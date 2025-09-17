import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/auth';
import { getToken } from '../services/api';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AuthActionTypes = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  LOAD_USER_START: 'LOAD_USER_START',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AuthActionTypes.LOGIN_START:
    case AuthActionTypes.LOAD_USER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AuthActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AuthActionTypes.LOAD_USER_SUCCESS:
    case AuthActionTypes.UPDATE_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AuthActionTypes.LOGIN_FAILURE:
    case AuthActionTypes.LOAD_USER_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case AuthActionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case AuthActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = getToken();
      if (token) {
        dispatch({ type: AuthActionTypes.LOAD_USER_START });
        try {
          const user = await authService.getProfile();
          dispatch({ type: AuthActionTypes.LOAD_USER_SUCCESS, payload: user });
        } catch (error) {
          dispatch({ type: AuthActionTypes.LOAD_USER_FAILURE, payload: error.message });
        }
      } else {
        dispatch({ type: AuthActionTypes.LOAD_USER_FAILURE, payload: null });
      }
    };

    loadUser();
  }, []);

  // Actions
  const login = async (email, password) => {
    dispatch({ type: AuthActionTypes.LOGIN_START });
    try {
      const result = await authService.login(email, password);
      dispatch({ type: AuthActionTypes.LOGIN_SUCCESS, payload: result });
      return result;
    } catch (error) {
      dispatch({ type: AuthActionTypes.LOGIN_FAILURE, payload: error.message });
      throw error;
    }
  };

  const register = async (userData) => {
    dispatch({ type: AuthActionTypes.LOGIN_START });
    try {
      const result = await authService.register(userData);
      dispatch({ type: AuthActionTypes.LOGIN_SUCCESS, payload: result });
      return result;
    } catch (error) {
      dispatch({ type: AuthActionTypes.LOGIN_FAILURE, payload: error.message });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: AuthActionTypes.LOGOUT });
    }
  };

  const updateProfile = async (userData) => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      dispatch({ type: AuthActionTypes.UPDATE_USER, payload: updatedUser });
      return updatedUser;
    } catch (error) {
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: AuthActionTypes.CLEAR_ERROR });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
