/**
 * Custom React hook for WebSocket management
 * Implements best practices for WebSocket in React applications
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import WebSocketService from '../services/websocket';

export const useWebSocket = (url, options = {}) => {
  const {
    token = null,
    enabled = true,
    onMessage = null,
    onOpen = null,
    onClose = null,
    onError = null,
    onMaxReconnectAttempts = null
  } = options;

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    if (!enabled || !url) return;
    
    setConnecting(true);
    setError(null);
    
    WebSocketService.connect(url, token);
  }, [enabled, url, token]);

  const disconnect = useCallback(() => {
    WebSocketService.close();
    setConnected(false);
    setConnecting(false);
  }, []);

  const send = useCallback((data) => {
    WebSocketService.send(data);
  }, []);

  useEffect(() => {
    if (!enabled) {
      disconnect();
      return;
    }

    // Set up event listeners
    const handleOpen = () => {
      setConnected(true);
      setConnecting(false);
      setError(null);
      reconnectAttempts.current = 0;
      onOpen && onOpen();
    };

    const handleMessage = (data) => {
      onMessage && onMessage(data);
    };

    const handleClose = (event) => {
      setConnected(false);
      setConnecting(false);
      onClose && onClose(event);
    };

    const handleError = (err) => {
      setError(err);
      setConnecting(false);
      onError && onError(err);
    };

    const handleMaxReconnectAttempts = () => {
      setConnected(false);
      setConnecting(false);
      onMaxReconnectAttempts && onMaxReconnectAttempts();
    };

    // Register event listeners
    WebSocketService.on('open', handleOpen);
    WebSocketService.on('message', handleMessage);
    WebSocketService.on('close', handleClose);
    WebSocketService.on('error', handleError);
    WebSocketService.on('maxReconnectAttemptsReached', handleMaxReconnectAttempts);

    // Connect if not already connected
    if (WebSocketService.readyState === WebSocket.CLOSED) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      WebSocketService.off('open', handleOpen);
      WebSocketService.off('message', handleMessage);
      WebSocketService.off('close', handleClose);
      WebSocketService.off('error', handleError);
      WebSocketService.off('maxReconnectAttemptsReached', handleMaxReconnectAttempts);
    };
  }, [enabled, url, token, connect, disconnect, onOpen, onMessage, onClose, onError, onMaxReconnectAttempts]);

  // Update connected state based on WebSocket state
  useEffect(() => {
    const updateState = () => {
      setConnected(WebSocketService.connected);
      setConnecting(WebSocketService.readyState === WebSocket.CONNECTING);
    };

    updateState();
    const interval = setInterval(updateState, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    connected,
    connecting,
    error,
    send,
    connect,
    disconnect
  };
};
