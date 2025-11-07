<template>
  <div class="websocket-demo">
    <h2>WebSocket Connection Status</h2>
    
    <div class="status-indicators">
      <div class="indicator" :class="{ active: connected }">
        <span class="dot"></span>
        Connected: {{ connected ? 'Yes' : 'No' }}
      </div>
      
      <div class="indicator" :class="{ active: reconnecting }">
        <span class="dot"></span>
        Reconnecting: {{ reconnecting ? 'Yes' : 'No' }}
      </div>
      
      <div v-if="error" class="error">
        Error: {{ error }}
      </div>
    </div>
    
    <div class="controls">
      <button @click="connect" :disabled="connected">
        Connect
      </button>
      
      <button @click="disconnect" :disabled="!connected">
        Disconnect
      </button>
      
      <button @click="subscribeToTask" :disabled="!connected">
        Subscribe to Task
      </button>
      
      <button @click="unsubscribeFromTask" :disabled="!isSubscribed">
        Unsubscribe
      </button>
    </div>
    
    <div class="task-info">
      <h3>Task Information</h3>
      <p><strong>Task ID:</strong> {{ taskId }}</p>
      <p><strong>Status:</strong> {{ taskStatus }}</p>
      <p><strong>Progress:</strong> {{ taskProgress }}%</p>
      <p v-if="taskResult"><strong>Result:</strong> {{ taskResult }}</p>
      <p v-if="taskError" class="error"><strong>Error:</strong> {{ taskError }}</p>
    </div>
    
    <div class="messages">
      <h3>Recent Messages</h3>
      <div v-for="(message, index) in recentMessages" :key="index" class="message">
        <span class="timestamp">{{ message.timestamp }}</span>
        <span class="type">{{ message.type }}</span>
        <span class="content">{{ message.content }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onUnmounted } from 'vue'
import { useWebSocket } from '../composables/useWebSocket.js'

export default {
  name: 'WebSocketDemo',
  
  setup() {
    const {
      connected,
      reconnecting,
      error,
      connect,
      disconnect,
      subscribe,
      unsubscribe
    } = useWebSocket()
    
    // Task state
    const taskId = ref('demo-task-123')
    const taskStatus = ref('Not subscribed')
    const taskProgress = ref(0)
    const taskResult = ref(null)
    const taskError = ref(null)
    const isSubscribed = ref(false)
    let unsubscribeTask = null
    
    // Message history
    const recentMessages = ref([])
    
    const addMessage = (type, content) => {
      recentMessages.value.unshift({
        timestamp: new Date().toLocaleTimeString(),
        type,
        content
      })
      
      // Keep only last 10 messages
      if (recentMessages.value.length > 10) {
        recentMessages.value = recentMessages.value.slice(0, 10)
      }
    }
    
    const subscribeToTask = () => {
      if (!connected.value) return
      
      try {
        unsubscribeTask = subscribe(taskId.value, (message) => {
          addMessage('Task Message', `${message.type}: ${JSON.stringify(message.data || {})}`)
          
          switch (message.type) {
            case 'task_update':
              taskStatus.value = 'In Progress'
              taskProgress.value = message.data.progress || 0
              break
            case 'task_complete':
              taskStatus.value = 'Completed'
              taskProgress.value = 100
              taskResult.value = message.data.result
              break
            case 'task_error':
              taskStatus.value = 'Error'
              taskError.value = message.data.error
              break
          }
        })
        
        isSubscribed.value = true
        taskStatus.value = 'Subscribed'
        taskProgress.value = 0
        taskResult.value = null
        taskError.value = null
        
        addMessage('Subscription', `Subscribed to task ${taskId.value}`)
      } catch (err) {
        addMessage('Error', err.message)
      }
    }
    
    const unsubscribeFromTask = () => {
      if (unsubscribeTask) {
        unsubscribeTask()
        unsubscribeTask = null
        isSubscribed.value = false
        taskStatus.value = 'Not subscribed'
        taskProgress.value = 0
        taskResult.value = null
        taskError.value = null
        
        addMessage('Subscription', `Unsubscribed from task ${taskId.value}`)
      }
    }
    
    // Cleanup on unmount
    onUnmounted(() => {
      unsubscribeFromTask()
    })
    
    return {
      connected,
      reconnecting,
      error,
      connect,
      disconnect,
      subscribeToTask,
      unsubscribeFromTask,
      taskId,
      taskStatus,
      taskProgress,
      taskResult,
      taskError,
      isSubscribed,
      recentMessages
    }
  }
}
</script>

<style scoped>
.websocket-demo {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.status-indicators {
  margin: 20px 0;
}

.indicator {
  display: flex;
  align-items: center;
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.indicator.active {
  background-color: #e8f5e8;
  border-color: #4caf50;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #ccc;
  margin-right: 10px;
}

.indicator.active .dot {
  background-color: #4caf50;
}

.error {
  color: #f44336;
  margin: 10px 0;
  padding: 10px;
  background-color: #ffebee;
  border: 1px solid #f44336;
  border-radius: 4px;
}

.controls {
  margin: 20px 0;
}

.controls button {
  margin: 5px;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f5f5f5;
  cursor: pointer;
}

.controls button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.controls button:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.task-info {
  margin: 20px 0;
  padding: 15px;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.messages {
  margin: 20px 0;
}

.message {
  display: flex;
  gap: 10px;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
}

.timestamp {
  color: #666;
  font-size: 0.9em;
  min-width: 80px;
}

.type {
  font-weight: bold;
  min-width: 120px;
}

.content {
  color: #333;
}
</style>