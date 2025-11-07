# WebSocket Composable

The `useWebSocket` composable provides a robust WebSocket connection management system for Vue.js applications with auto-reconnection, heartbeat monitoring, and task-based subscriptions.

## Features

- **Connection Lifecycle Management**: Automatic connection establishment and cleanup
- **Auto-Reconnection**: Configurable reconnection attempts with exponential backoff
- **Heartbeat Monitoring**: Keeps connection alive and detects dead connections
- **Task-Based Subscriptions**: Subscribe to specific task updates with callbacks
- **Message Queue**: Queues messages when disconnected and delivers on reconnection
- **Reactive State**: Real-time connection status and error tracking
- **Type Safety**: Built with TypeScript support in mind

## Usage

### Basic Usage

```javascript
import { useWebSocket } from '@/composables/useWebSocket'

export default {
  setup() {
    const {
      connected,
      reconnecting,
      error,
      subscribe,
      unsubscribe
    } = useWebSocket()
    
    return {
      connected,
      reconnecting,
      error,
      subscribe,
      unsubscribe
    }
  }
}
```

### Task Subscription

```javascript
import { useWebSocket } from '@/composables/useWebSocket'

export default {
  setup() {
    const { subscribe } = useWebSocket()
    
    // Subscribe to task updates
    const unsubscribeTask = subscribe('task-123', (message) => {
      switch (message.type) {
        case 'task_update':
          console.log('Task progress:', message.data.progress)
          break
        case 'task_complete':
          console.log('Task completed:', message.data.result)
          unsubscribeTask() // Auto-unsubscribe on completion
          break
        case 'task_error':
          console.error('Task error:', message.data.error)
          break
      }
    })
    
    return {
      unsubscribeTask
    }
  }
}
```

### Manual Connection Control

```javascript
import { useWebSocket } from '@/composables/useWebSocket'

export default {
  setup() {
    const {
      connected,
      reconnecting,
      error,
      connect,
      disconnect,
      cleanup
    } = useWebSocket()
    
    // Manual connection control
    const handleConnect = () => {
      if (!connected.value) {
        connect()
      }
    }
    
    const handleDisconnect = () => {
      disconnect()
    }
    
    // Cleanup is automatically called on component unmount
    onUnmounted(() => {
      cleanup()
    })
    
    return {
      connected,
      reconnecting,
      error,
      handleConnect,
      handleDisconnect
    }
  }
}
```

## Configuration

The WebSocket behavior can be configured through environment variables:

```bash
# WebSocket server URL
VITE_WS_URL=ws://localhost:8080

# API key for authentication
VITE_WS_API_KEY=your-api-key-here
```

Additional configuration is available in `src/config/websocket.js`:

```javascript
export const websocketConfig = {
  baseUrl: 'ws://localhost:8080',
  apiKey: '',
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  reconnectBackoffMultiplier: 2,
  heartbeatInterval: 30000,
  heartbeatTimeout: 5000,
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
```

## API Reference

### Reactive State

- `connected` (Ref<boolean>): Whether the WebSocket is connected
- `reconnecting` (Ref<boolean>): Whether a reconnection attempt is in progress
- `error` (Ref<string|null>): Current error message, if any

### Methods

- `connect()`: Manually establish WebSocket connection
- `disconnect()`: Close WebSocket connection and cleanup
- `subscribe(taskId, callback)`: Subscribe to task updates
  - `taskId` (string): Unique task identifier
  - `callback` (function): Function to receive task messages
  - Returns: Unsubscribe function
- `unsubscribe(taskId, callback)`: Unsubscribe from task updates
- `sendMessage(message)`: Send a message through WebSocket
- `cleanup()`: Clean up all resources and close connection

### Message Types

The composable handles these message types automatically:

- `heartbeat`: Sent periodically to keep connection alive
- `heartbeat_response`: Response to heartbeat messages
- `task_update`: Progress updates for subscribed tasks
- `task_complete`: Completion notification for tasks
- `task_error`: Error notifications for tasks
- `subscribe`: Subscribe to task updates
- `unsubscribe`: Unsubscribe from task updates

## Integration with Stores

The composable works well with Pinia or other state management solutions:

```javascript
// stores/tasks.js
import { defineStore } from 'pinia'
import { useWebSocket } from '@/composables/useWebSocket'

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: {},
    connected: false
  }),
  
  actions: {
    initWebSocket() {
      const { connected, subscribe } = useWebSocket()
      
      this.connected = connected
      
      // Subscribe to all task updates
      this.taskUnsubscribe = subscribe('all', (message) => {
        this.handleTaskMessage(message)
      })
    },
    
    handleTaskMessage(message) {
      const { taskId, type, data } = message
      
      if (!this.tasks[taskId]) {
        this.tasks[taskId] = { id: taskId, status: 'pending' }
      }
      
      switch (type) {
        case 'task_update':
          this.tasks[taskId].progress = data.progress
          break
        case 'task_complete':
          this.tasks[taskId].status = 'completed'
          this.tasks[taskId].result = data.result
          break
        case 'task_error':
          this.tasks[taskId].status = 'error'
          this.tasks[taskId].error = data.error
          break
      }
    }
  }
})
```

## Error Handling

The composable provides comprehensive error handling:

- Connection errors are tracked in the `error` ref
- Reconnection attempts are made automatically with exponential backoff
- Heartbeat timeouts trigger reconnection
- Invalid subscription parameters throw descriptive errors

## Testing

The composable includes comprehensive tests that mock WebSocket behavior:

```bash
# Run tests
npm run test

# Run tests with UI
npm run test:ui
```

Tests cover:
- Connection lifecycle
- Heartbeat mechanism
- Reconnection logic
- Task subscriptions
- Message delivery
- Error handling
- Cleanup functionality

## Best Practices

1. **Always cleanup on unmount**: The composable handles this automatically
2. **Use specific task IDs**: Subscribe to specific tasks rather than global updates
3. **Handle all message types**: Ensure your callbacks handle update, complete, and error cases
4. **Monitor connection state**: Use the reactive state to update UI accordingly
5. **Configure appropriately**: Adjust heartbeat and reconnection settings based on your server requirements

## Troubleshooting

### Connection Issues

1. Check `VITE_WS_URL` environment variable
2. Verify server is running and accessible
3. Check browser console for WebSocket errors
4. Ensure API key is configured if required

### Reconnection Problems

1. Check `reconnectAttempts` and `reconnectDelay` configuration
2. Monitor `reconnecting` and `error` states
3. Verify server handles reconnections properly

### Message Delivery Issues

1. Ensure message types match server expectations
2. Check that task IDs are consistent
3. Verify message format is valid JSON
4. Monitor browser network tab for WebSocket traffic