import { ref, reactive, onUnmounted, nextTick } from 'vue'
import { websocketConfig } from '../config/websocket.js'

export function useWebSocket() {
  // Reactive state
  const connected = ref(false)
  const reconnecting = ref(false)
  const error = ref(null)
  const socket = ref(null)
  
  // Internal state
  const reconnectCount = ref(0)
  const heartbeatTimer = ref(null)
  const heartbeatTimeoutTimer = ref(null)
  const subscriptions = reactive(new Map()) // taskId -> Set of callbacks
  const messageQueue = ref([])
  
  // Connect to WebSocket
  const connect = () => {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      return
    }
    
    try {
      // Build WebSocket URL with API key if provided
      const wsUrl = new URL(websocketConfig.baseUrl)
      if (websocketConfig.apiKey) {
        wsUrl.searchParams.set('api_key', websocketConfig.apiKey)
      }
      
      socket.value = new WebSocket(wsUrl.toString())
      
      socket.value.onopen = () => {
        console.log('WebSocket connected')
        connected.value = true
        reconnecting.value = false
        error.value = null
        reconnectCount.value = 0
        
        // Start heartbeat
        startHeartbeat()
        
        // Process any queued messages
        processMessageQueue()
      }
      
      socket.value.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          handleMessage(message)
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }
      
      socket.value.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        connected.value = false
        stopHeartbeat()
        
        // Attempt reconnection if not a normal closure
        if (event.code !== 1000 && reconnectCount.value < websocketConfig.reconnectAttempts) {
          reconnect()
        }
      }
      
      socket.value.onerror = (event) => {
        console.error('WebSocket error:', event)
        error.value = 'WebSocket connection error'
      }
      
    } catch (err) {
      error.value = `Failed to connect: ${err.message}`
      console.error('WebSocket connection failed:', err)
    }
  }
  
  // Disconnect WebSocket
  const disconnect = () => {
    if (socket.value) {
      stopHeartbeat()
      socket.value.close(1000, 'Client disconnect')
      socket.value = null
    }
    connected.value = false
    reconnecting.value = false
    subscriptions.clear()
  }
  
  // Reconnection logic
  const reconnect = () => {
    if (reconnecting.value) return
    
    reconnecting.value = true
    reconnectCount.value++
    
    const delay = websocketConfig.reconnectDelay * 
      Math.pow(websocketConfig.reconnectBackoffMultiplier, reconnectCount.value - 1)
    
    console.log(`Attempting reconnection ${reconnectCount.value}/${websocketConfig.reconnectAttempts} in ${delay}ms`)
    
    setTimeout(() => {
      connect()
    }, delay)
  }
  
  // Heartbeat mechanism
  const startHeartbeat = () => {
    stopHeartbeat()
    
    heartbeatTimer.value = setInterval(() => {
      if (socket.value && socket.value.readyState === WebSocket.OPEN) {
        // Send heartbeat
        sendMessage({
          type: websocketConfig.messageTypes.HEARTBEAT,
          timestamp: Date.now()
        })
        
        // Set timeout for heartbeat response
        heartbeatTimeoutTimer.value = setTimeout(() => {
          console.warn('Heartbeat timeout - connection may be dead')
          if (socket.value) {
            socket.value.close(1006, 'Heartbeat timeout')
          }
        }, websocketConfig.heartbeatTimeout)
      }
    }, websocketConfig.heartbeatInterval)
  }
  
  const stopHeartbeat = () => {
    if (heartbeatTimer.value) {
      clearInterval(heartbeatTimer.value)
      heartbeatTimer.value = null
    }
    if (heartbeatTimeoutTimer.value) {
      clearTimeout(heartbeatTimeoutTimer.value)
      heartbeatTimeoutTimer.value = null
    }
  }
  
  // Send message through WebSocket
  const sendMessage = (message) => {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify(message))
      return true
    } else {
      // Queue message for later delivery
      messageQueue.value.push(message)
      return false
    }
  }
  
  // Process queued messages
  const processMessageQueue = () => {
    while (messageQueue.value.length > 0) {
      const message = messageQueue.value.shift()
      sendMessage(message)
    }
  }
  
  // Handle incoming messages
  const handleMessage = (message) => {
    switch (message.type) {
      case websocketConfig.messageTypes.HEARTBEAT_RESPONSE:
        // Clear heartbeat timeout
        if (heartbeatTimeoutTimer.value) {
          clearTimeout(heartbeatTimeoutTimer.value)
          heartbeatTimeoutTimer.value = null
        }
        break
        
      case websocketConfig.messageTypes.TASK_UPDATE:
      case websocketConfig.messageTypes.TASK_COMPLETE:
      case websocketConfig.messageTypes.TASK_ERROR:
        // Deliver to task-specific subscribers
        if (message.taskId && subscriptions.has(message.taskId)) {
          const callbacks = subscriptions.get(message.taskId)
          callbacks.forEach(callback => {
            try {
              callback(message)
            } catch (err) {
              console.error('Error in task subscription callback:', err)
            }
          })
        }
        break
        
      default:
        console.log('Unhandled WebSocket message type:', message.type)
    }
  }
  
  // Subscribe to task updates
  const subscribe = (taskId, callback) => {
    if (!taskId || typeof callback !== 'function') {
      throw new Error('Task ID and callback are required')
    }
    
    // Add callback to subscriptions
    if (!subscriptions.has(taskId)) {
      subscriptions.set(taskId, new Set())
    }
    subscriptions.get(taskId).add(callback)
    
    // Send subscription message
    sendMessage({
      type: websocketConfig.messageTypes.SUBSCRIBE,
      taskId,
      timestamp: Date.now()
    })
    
    // Return unsubscribe function
    return () => unsubscribe(taskId, callback)
  }
  
  // Unsubscribe from task updates
  const unsubscribe = (taskId, callback) => {
    if (!subscriptions.has(taskId)) return
    
    const callbacks = subscriptions.get(taskId)
    callbacks.delete(callback)
    
    // Remove task from subscriptions if no more callbacks
    if (callbacks.size === 0) {
      subscriptions.delete(taskId)
      
      // Send unsubscribe message
      sendMessage({
        type: websocketConfig.messageTypes.UNSUBSCRIBE,
        taskId,
        timestamp: Date.now()
      })
    }
  }
  
  // Cleanup on component unmount
  const cleanup = () => {
    disconnect()
  }
  
  // Auto-connect
  nextTick(() => {
    connect()
  })
  
  // Register cleanup
  onUnmounted(cleanup)
  
  return {
    // State
    connected,
    reconnecting,
    error,
    
    // Methods
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    sendMessage,
    cleanup
  }
}