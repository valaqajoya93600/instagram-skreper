# WebSocket Composable Implementation

This project includes a comprehensive WebSocket composable for Vue.js applications that provides real-time communication capabilities with robust connection management.

## Overview

The `useWebSocket` composable abstracts WebSocket connectivity and provides:

- **Connection Lifecycle Management**: Automatic connection establishment and cleanup
- **Auto-Reconnection**: Configurable reconnection attempts with exponential backoff
- **Heartbeat Monitoring**: Keeps connections alive and detects dead connections
- **Task-Based Subscriptions**: Subscribe to specific task updates with callbacks
- **Message Queue**: Queues messages when disconnected and delivers on reconnection
- **Reactive State**: Real-time connection status and error tracking

## Files Structure

```
src/
├── composables/
│   ├── useWebSocket.js          # Main composable implementation
│   ├── __tests__/
│   │   ├── useWebSocket.test.js # Comprehensive test suite
│   │   └── useWebSocket.simple.test.js # Simple API tests
│   └── README.md                # Detailed composable documentation
├── config/
│   └── websocket.js             # WebSocket configuration
├── components/
│   ├── WebSocketDemo.vue        # Demo component showing usage
│   └── TaskMonitor.vue          # Real-world task monitoring component
└── test/
    └── setup.js                 # Test setup utilities
```

## Quick Start

### 1. Basic Usage

```javascript
import { useWebSocket } from '@/composables/useWebSocket.js'

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

### 2. Task Subscription

```javascript
const { subscribe } = useWebSocket()

// Subscribe to task updates
const unsubscribeTask = subscribe('task-123', (message) => {
  switch (message.type) {
    case 'task_update':
      console.log('Progress:', message.data.progress)
      break
    case 'task_complete':
      console.log('Completed:', message.data.result)
      break
    case 'task_error':
      console.error('Error:', message.data.error)
      break
  }
})
```

### 3. Environment Configuration

Create a `.env` file with your WebSocket configuration:

```bash
VITE_WS_URL=ws://localhost:8080
VITE_WS_API_KEY=your-api-key-here
```

## Features

### Connection Management

- **Auto-connect**: Establishes connection when composable is created
- **Auto-reconnect**: Attempts reconnection with exponential backoff
- **Cleanup**: Automatically cleans up on component unmount

### Heartbeat System

- **Periodic pings**: Sends heartbeat messages every 30 seconds
- **Timeout detection**: Detects dead connections after 5 seconds
- **Auto-recovery**: Triggers reconnection on heartbeat timeout

### Task Subscriptions

- **Targeted updates**: Subscribe to specific task IDs
- **Multiple callbacks**: Support multiple callbacks per task
- **Auto-unsubscribe**: Automatic cleanup when callbacks are removed

### Message Handling

- **Type safety**: Structured message types for different events
- **Error handling**: Graceful error handling and recovery
- **Queue system**: Messages queued when disconnected

## API Reference

### Reactive State

- `connected` (Ref<boolean>): WebSocket connection status
- `reconnecting` (Ref<boolean>): Reconnection attempt status  
- `error` (Ref<string|null>): Current error message

### Methods

- `connect()`: Manually establish connection
- `disconnect()`: Close connection and cleanup
- `subscribe(taskId, callback)`: Subscribe to task updates
- `unsubscribe(taskId, callback)`: Unsubscribe from task updates
- `sendMessage(message)`: Send message through WebSocket
- `cleanup()`: Clean up all resources

### Message Types

- `heartbeat`: Connection health check
- `heartbeat_response`: Heartbeat acknowledgment
- `task_update`: Task progress updates
- `task_complete`: Task completion notification
- `task_error`: Task error notification
- `subscribe`: Subscribe to task updates
- `unsubscribe`: Unsubscribe from task updates

## Testing

The implementation includes comprehensive tests:

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run specific test file
npx vitest run src/composables/__tests__/useWebSocket.simple.test.js
```

### Test Coverage

- ✅ Connection lifecycle management
- ✅ Heartbeat mechanism
- ✅ Auto-reconnection logic
- ✅ Task subscriptions
- ✅ Message delivery
- ✅ Error handling
- ✅ Cleanup functionality
- ✅ Message queuing

## Example Components

### WebSocketDemo
A demonstration component showing:
- Connection status indicators
- Manual connection controls
- Task subscription management
- Real-time message display
- Error handling

### TaskMonitor
A production-ready component featuring:
- Multi-task monitoring
- Progress tracking
- Auto-unsubscription on completion
- Visual status indicators
- Comprehensive error handling

## Configuration

The WebSocket behavior is configurable through:

1. **Environment Variables**:
   - `VITE_WS_URL`: WebSocket server URL
   - `VITE_WS_API_KEY`: Authentication API key

2. **Configuration File** (`src/config/websocket.js`):
   - Reconnection settings
   - Heartbeat intervals
   - Message type definitions
   - Timeout values

## Best Practices

1. **Component Integration**: Use the composable in Vue components with proper lifecycle management
2. **Error Handling**: Always handle connection errors and reconnection states
3. **Task Management**: Subscribe to specific tasks rather than global updates
4. **Cleanup**: The composable handles cleanup automatically, but monitor for memory leaks
5. **Performance**: Use debouncing/throttling for frequent updates

## Integration with State Management

The composable works well with Pinia or other state management:

```javascript
// stores/websocket.js
import { defineStore } from 'pinia'
import { useWebSocket } from '@/composables/useWebSocket.js'

export const useWebSocketStore = defineStore('websocket', {
  state: () => ({
    connected: false,
    tasks: {}
  }),
  
  actions: {
    init() {
      const { connected, subscribe } = useWebSocket()
      
      this.connected = connected
      
      subscribe('global', (message) => {
        this.handleMessage(message)
      })
    },
    
    handleMessage(message) {
      // Handle global messages
    }
  }
})
```

## Troubleshooting

### Common Issues

1. **Connection Failures**: Check `VITE_WS_URL` and server availability
2. **Authentication**: Ensure `VITE_WS_API_KEY` is properly configured
3. **Reconnection Loops**: Verify server handles reconnections correctly
4. **Memory Leaks**: Monitor subscription cleanup in development

### Debug Mode

Enable detailed logging by modifying the configuration:

```javascript
// src/config/websocket.js
export const websocketConfig = {
  // ... other config
  debug: true // Enable console logging
}
```

## Browser Compatibility

The WebSocket composable requires:
- **WebSocket API**: Supported in all modern browsers
- **Vue 3**: Composition API support
- **ES6+**: Modern JavaScript features

## Server Requirements

The WebSocket server should support:
- Standard WebSocket protocol
- JSON message format
- Heartbeat/response pattern
- Task-based message routing
- Optional API key authentication

## License

This WebSocket composable implementation is part of the Railway Deployment Automation project and follows the same MIT license.