<template>
  <div class="task-monitor">
    <!-- Header with Filters -->
    <div class="monitor-header">
      <h2>Scrape Tasks</h2>
      <div class="connection-status">
        <span :class="['status-indicator', wsConnected ? 'connected' : 'disconnected']">
          {{ wsConnected ? '● Live' : '● Offline' }}
        </span>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filter-group">
        <label for="status-filter">Status:</label>
        <select id="status-filter" v-model="statusFilter" @change="applyFilters">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
          <option value="challenge_required">Challenge Required</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label for="time-filter">Time Range:</label>
        <select id="time-filter" v-model="timeFilter" @change="applyFilters">
          <option value="all">All Time</option>
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      <button class="refresh-btn" @click="refreshTasks" :disabled="loading">
        {{ loading ? 'Loading...' : 'Refresh' }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && tasks.length === 0" class="loading-state">
      <div class="spinner"></div>
      <p>Loading tasks...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-state">
      <p>❌ {{ error }}</p>
      <button @click="refreshTasks">Retry</button>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && !error && paginatedTasks.length === 0" class="empty-state">
      <p>📋 No tasks found</p>
      <button @click="refreshTasks">Refresh</button>
    </div>

    <!-- Tasks List -->
    <div v-if="!loading && !error && paginatedTasks.length > 0" class="tasks-list">
      <TaskItem
        v-for="task in paginatedTasks"
        :key="task.id"
        :task="task"
        @cancel="handleCancel"
        @download="handleDownload"
        @view="handleView"
      />
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
        class="pagination-btn"
      >
        Previous
      </button>
      
      <span class="page-info">
        Page {{ currentPage }} of {{ totalPages }} ({{ totalTasks }} tasks)
      </span>
      
      <button
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
        class="pagination-btn"
      >
        Next
      </button>
    </div>

    <!-- Toast Notifications -->
    <div class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast', toast.type]"
      >
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useTaskStore } from '../stores/taskStore'
import TaskItem from './TaskItem.vue'

export default {
  name: 'TaskMonitor',
  components: {
    TaskItem
  },
  setup() {
    const taskStore = useTaskStore()
    const toasts = ref([])

    // Computed properties from store
    const tasks = computed(() => taskStore.tasks)
    const loading = computed(() => taskStore.loading)
    const error = computed(() => taskStore.error)
    const wsConnected = computed(() => taskStore.wsConnected)
    const paginatedTasks = computed(() => taskStore.paginatedTasks)
    const currentPage = computed(() => taskStore.currentPage)
    const totalPages = computed(() => taskStore.totalPages)
    const totalTasks = computed(() => taskStore.totalTasks)
    const statusFilter = computed({
      get: () => taskStore.statusFilter,
      set: (value) => taskStore.statusFilter = value
    })
    const timeFilter = computed({
      get: () => taskStore.timeFilter,
      set: (value) => taskStore.timeFilter = value
    })

    // Toast management
    const addToast = (message, type = 'info') => {
      const toast = {
        id: Date.now(),
        message,
        type
      }
      toasts.value.push(toast)
      
      // Auto remove after 5 seconds
      setTimeout(() => {
        const index = toasts.value.findIndex(t => t.id === toast.id)
        if (index > -1) {
          toasts.value.splice(index, 1)
        }
      }, 5000)
    }

    // Event handlers
    const handleCancel = async (taskId) => {
      try {
        await taskStore.cancelTask(taskId)
        addToast(`Task ${taskId} cancellation requested`, 'info')
      } catch (err) {
        addToast('Failed to cancel task', 'error')
      }
    }

    const handleDownload = async (taskId) => {
      try {
        await taskStore.downloadResults(taskId)
        addToast('Download started', 'success')
      } catch (err) {
        addToast('Failed to download results', 'error')
      }
    }

    const handleView = (task) => {
      // Could open a modal or navigate to detail view
      console.log('View task:', task)
      addToast(`Viewing task ${task.id}`, 'info')
    }

    const refreshTasks = () => {
      taskStore.fetchTasks(currentPage.value)
    }

    const applyFilters = () => {
      taskStore.setFilters({
        status: statusFilter.value,
        time: timeFilter.value
      })
    }

    const goToPage = (page) => {
      taskStore.setPage(page)
    }

    // Watch for task status changes to show toasts
    watch(
      () => taskStore.tasks,
      (newTasks, oldTasks) => {
        if (!oldTasks || oldTasks.length === 0) return
        
        newTasks.forEach(task => {
          const oldTask = oldTasks.find(t => t.id === task.id)
          if (oldTask && oldTask.status !== task.status) {
            switch (task.status) {
              case 'completed':
                addToast(`Task ${task.id} completed successfully`, 'success')
                break
              case 'failed':
                addToast(`Task ${task.id} failed: ${task.error || 'Unknown error'}`, 'error')
                break
              case 'cancelled':
                addToast(`Task ${task.id} was cancelled`, 'info')
                break
              case 'challenge_required':
                addToast(`Task ${task.id} requires attention: ${task.challenge}`, 'warning')
                break
            }
          }
        })
      },
      { deep: true }
    )

    onMounted(() => {
      taskStore.initialize()
    })

    onUnmounted(() => {
      taskStore.disconnectWebSocket()
    })

    return {
      tasks,
      loading,
      error,
      wsConnected,
      paginatedTasks,
      currentPage,
      totalPages,
      totalTasks,
      statusFilter,
      timeFilter,
      toasts,
      handleCancel,
      handleDownload,
      handleView,
      refreshTasks,
      applyFilters,
      goToPage
    }
  }
}
</script>

<style scoped>
.task-monitor {
  max-width: 1200px;
  margin: 0 auto;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.monitor-header h2 {
  color: #2c3e50;
  font-size: 1.75rem;
  font-weight: 600;
}

.connection-status {
  font-size: 0.875rem;
}

.status-indicator {
  font-weight: 600;
}

.status-indicator.connected {
  color: #27ae60;
}

.status-indicator.disconnected {
  color: #e74c3c;
}

.filters-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 500;
  color: #555;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  min-width: 150px;
}

.refresh-btn {
  padding: 0.5rem 1rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #2980b9;
}

.refresh-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.pagination-btn {
  padding: 0.5rem 1rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #2980b9;
}

.pagination-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 0.875rem;
}

.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toast {
  padding: 1rem 1.5rem;
  border-radius: 4px;
  color: white;
  font-weight: 500;
  min-width: 250px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  animation: slideIn 0.3s ease-out;
}

.toast.success {
  background: #27ae60;
}

.toast.error {
  background: #e74c3c;
}

.toast.warning {
  background: #f39c12;
}

.toast.info {
  background: #3498db;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>