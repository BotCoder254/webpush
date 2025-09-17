import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  isDark: false,
  sidebarCollapsed: false,
};

// Action types
const ThemeActionTypes = {
  TOGGLE_THEME: 'TOGGLE_THEME',
  SET_THEME: 'SET_THEME',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_SIDEBAR: 'SET_SIDEBAR',
};

// Reducer
const themeReducer = (state, action) => {
  switch (action.type) {
    case ThemeActionTypes.TOGGLE_THEME:
      return {
        ...state,
        isDark: !state.isDark,
      };

    case ThemeActionTypes.SET_THEME:
      return {
        ...state,
        isDark: action.payload,
      };

    case ThemeActionTypes.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed,
      };

    case ThemeActionTypes.SET_SIDEBAR:
      return {
        ...state,
        sidebarCollapsed: action.payload,
      };

    default:
      return state;
  }
};

// Create context
const ThemeContext = createContext();

// Provider component
export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedSidebar = localStorage.getItem('sidebarCollapsed');
    
    if (savedTheme) {
      dispatch({ type: ThemeActionTypes.SET_THEME, payload: savedTheme === 'dark' });
    }
    
    if (savedSidebar) {
      dispatch({ type: ThemeActionTypes.SET_SIDEBAR, payload: savedSidebar === 'true' });
    }
  }, []);

  // Update localStorage and document class when theme changes
  useEffect(() => {
    localStorage.setItem('theme', state.isDark ? 'dark' : 'light');
    
    if (state.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.isDark]);

  // Update localStorage when sidebar state changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', state.sidebarCollapsed.toString());
  }, [state.sidebarCollapsed]);

  // Actions
  const toggleTheme = () => {
    dispatch({ type: ThemeActionTypes.TOGGLE_THEME });
  };

  const setTheme = (isDark) => {
    dispatch({ type: ThemeActionTypes.SET_THEME, payload: isDark });
  };

  const toggleSidebar = () => {
    dispatch({ type: ThemeActionTypes.TOGGLE_SIDEBAR });
  };

  const setSidebar = (collapsed) => {
    dispatch({ type: ThemeActionTypes.SET_SIDEBAR, payload: collapsed });
  };

  const value = {
    ...state,
    toggleTheme,
    setTheme,
    toggleSidebar,
    setSidebar,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
