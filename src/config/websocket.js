// WebSocket configuration
export const websocketConfig = {
  // Base WebSocket URL - can be overridden by environment variable
  baseUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:8080',
  
  // API key for authentication - can be overridden by environment variable
  apiKey: import.meta.env.VITE_WS_API_KEY || '',
  
  // Connection settings
  reconnectAttempts: 5,
  reconnectDelay: 1000, // Base delay in ms
  reconnectBackoffMultiplier: 2,
  heartbeatInterval: 30000, // 30 seconds
  heartbeatTimeout: 5000, // 5 seconds
  
  // Message types
  messageTypes: {
    HEARTBEAT: 'heartbeat',
    HEARTBEAT_RESPONSE: 'heartbeat_response',
    TASK_UPDATE: 'task_update',
    TASK_COMPLETE: 'task_complete',
    TASK_ERROR: 'task_error',
    SUBSCRIBE: 'subscribe',
    UNSUBSCRIBE: 'unsubscribe'
  }
}