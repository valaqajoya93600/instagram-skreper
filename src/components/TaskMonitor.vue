<template>
  <div class="task-monitor">
    <h3>Task Monitor</h3>
    
    <div class="connection-status">
      <span class="status-indicator" :class="connectionClass">
        {{ connectionText }}
      </span>
    </div>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div class="task-controls">
      <input 
        v-model="newTaskId" 
        placeholder="Enter task ID"
        @keyup.enter="subscribeToTask"
      />
      <button 
        @click="subscribeToTask" 
        :disabled="!connected || !newTaskId.trim()"
      >
        Subscribe
      </button>
    </div>
    
    <div v-if="tasks.length > 0" class="tasks-list">
      <h4>Active Tasks</h4>
      <div 
        v-for="task in tasks" 
        :key="task.id"
        class="task-item"
        :class="{ 'task-completed': task.status === 'completed' }"
      >
        <div class="task-header">
          <span class="task-id">{{ task.id }}</span>
          <span class="task-status" :class="`status-${task.status}`">
            {{ task.status }}
          </span>
          <button @click="unsubscribeFromTask(task.id)" class="remove-btn">
            ×
          </button>
        </div>
        
        <div v-if="task.progress !== undefined" class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${task.progress}%` }"
          ></div>
          <span class="progress-text">{{ task.progress }}%</span>
        </div>
        
        <div v-if="task.result" class="task-result">
          <strong>Result:</strong> {{ task.result }}
        </div>
        
        <div v-if="task.error" class="task-error">
          <strong>Error:</strong> {{ task.error }}
        </div>
      </div>
    </div>
    
    <div v-else class="no-tasks">
      No tasks subscribed. Enter a task ID to monitor.
    </div>
  </div>
</template>

<script>
import { ref, computed, onUnmounted } from 'vue'
import { useWebSocket } from '../composables/useWebSocket.js'

export default {
  name: 'TaskMonitor',
  
  setup() {
    const {
      connected,
      reconnecting,
      error,
      subscribe,
      unsubscribe
    } = useWebSocket()
    
    // Component state
    const newTaskId = ref('')
    const tasks = ref([])
    const unsubscribers = ref(new Map())
    
    // Computed properties
    const connectionClass = computed(() => {
      if (reconnecting.value) return 'reconnecting'
      if (connected.value) return 'connected'
      return 'disconnected'
    })
    
    const connectionText = computed(() => {
      if (reconnecting.value) return 'Reconnecting...'
      if (connected.value) return 'Connected'
      return 'Disconnected'
    })
    
    // Methods
    const subscribeToTask = () => {
      const taskId = newTaskId.value.trim()
      if (!taskId || !connected.value) return
      
      // Check if already subscribed
      if (tasks.value.some(task => task.id === taskId)) {
        return
      }
      
      try {
        // Add task to list
        tasks.value.push({
          id: taskId,
          status: 'subscribed',
          progress: 0
        })
        
        // Subscribe to task updates
        const unsubscribeFn = subscribe(taskId, (message) => {
          handleTaskMessage(taskId, message)
        })
        
        // Store unsubscribe function
        unsubscribers.value.set(taskId, unsubscribeFn)
        
        // Clear input
        newTaskId.value = ''
        
      } catch (err) {
        console.error('Failed to subscribe to task:', err)
        // Remove task from list if subscription failed
        tasks.value = tasks.value.filter(task => task.id !== taskId)
      }
    }
    
    const unsubscribeFromTask = (taskId) => {
      // Call unsubscribe function
      const unsubscribeFn = unsubscribers.value.get(taskId)
      if (unsubscribeFn) {
        unsubscribeFn()
        unsubscribers.value.delete(taskId)
      }
      
      // Remove task from list
      tasks.value = tasks.value.filter(task => task.id !== taskId)
    }
    
    const handleTaskMessage = (taskId, message) => {
      const taskIndex = tasks.value.findIndex(task => task.id === taskId)
      if (taskIndex === -1) return
      
      const task = tasks.value[taskIndex]
      
      switch (message.type) {
        case 'task_update':
          task.status = 'in_progress'
          if (message.data?.progress !== undefined) {
            task.progress = message.data.progress
          }
          break
          
        case 'task_complete':
          task.status = 'completed'
          task.progress = 100
          if (message.data?.result) {
            task.result = message.data.result
          }
          // Auto-unsubscribe after completion
          setTimeout(() => {
            unsubscribeFromTask(taskId)
          }, 5000)
          break
          
        case 'task_error':
          task.status = 'error'
          if (message.data?.error) {
            task.error = message.data.error
          }
          break
      }
    }
    
    // Cleanup on unmount
    onUnmounted(() => {
      // Unsubscribe from all tasks
      unsubscribers.value.forEach((unsubscribeFn, taskId) => {
        unsubscribeFn()
      })
      unsubscribers.value.clear()
      tasks.value = []
    })
    
    return {
      connected,
      reconnecting,
      error,
      newTaskId,
      tasks,
      connectionClass,
      connectionText,
      subscribeToTask,
      unsubscribeFromTask
    }
  }
}
</script>

<style scoped>
.task-monitor {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: Arial, sans-serif;
}

.connection-status {
  margin-bottom: 20px;
}

.status-indicator {
  display: inline-block;
  padding: 8px 12px;
  border-radius: 4px;
  font-weight: bold;
}

.status-indicator.connected {
  background-color: #d4edda;
  color: #155724;
}

.status-indicator.reconnecting {
  background-color: #fff3cd;
  color: #856404;
}

.status-indicator.disconnected {
  background-color: #f8d7da;
  color: #721c24;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.task-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.task-controls input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.task-controls button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
}

.task-controls button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.tasks-list h4 {
  margin-bottom: 15px;
  color: #333;
}

.task-item {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 10px;
  background-color: #f9f9f9;
}

.task-item.task-completed {
  background-color: #d4edda;
  border-color: #c3e6cb;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.task-id {
  font-weight: bold;
  color: #007bff;
}

.task-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: bold;
}

.status-subscribed {
  background-color: #e2e3e5;
  color: #383d41;
}

.status-in_progress {
  background-color: #fff3cd;
  color: #856404;
}

.status-completed {
  background-color: #d4edda;
  color: #155724;
}

.status-error {
  background-color: #f8d7da;
  color: #721c24;
}

.remove-btn {
  background: none;
  border: none;
  color: #dc3545;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
}

.progress-bar {
  position: relative;
  height: 20px;
  background-color: #e9ecef;
  border-radius: 10px;
  margin: 10px 0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #007bff;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #333;
  font-size: 12px;
  font-weight: bold;
}

.task-result {
  margin-top: 10px;
  padding: 8px;
  background-color: #e7f3ff;
  border-radius: 4px;
}

.task-error {
  margin-top: 10px;
  padding: 8px;
  background-color: #f8d7da;
  border-radius: 4px;
  color: #721c24;
}

.no-tasks {
  text-align: center;
  color: #6c757d;
  font-style: italic;
  padding: 20px;
}
</style>