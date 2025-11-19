import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Get initial theme from localStorage or system preference
const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    // Check if dark class is already applied (from the HTML script)
    const hasInitialDarkClass = document.documentElement.classList.contains('dark');
    if (hasInitialDarkClass) {
      return true;
    }
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

// Initial state
const initialState = {
  isDark: getInitialTheme(),
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

  // Initialize theme immediately
  useEffect(() => {
    // Apply initial theme to document immediately
    const applyTheme = (isDark) => {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Apply the initial theme
    applyTheme(state.isDark);

    // Load sidebar preference
    const savedSidebar = localStorage.getItem('sidebarCollapsed');
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
