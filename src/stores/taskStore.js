import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useTaskStore = defineStore('tasks', () => {
  // State
  const tasks = ref([])
  const loading = ref(false)
  const error = ref(null)
  const wsConnection = ref(null)
  const wsConnected = ref(false)
  
  // Pagination
  const currentPage = ref(1)
  const totalPages = ref(1)
  const totalTasks = ref(0)
  const pageSize = ref(20)
  
  // Filters
  const statusFilter = ref('all')
  const timeFilter = ref('all')

  // Computed
  const filteredTasks = computed(() => {
    let filtered = [...tasks.value]
    
    if (statusFilter.value !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter.value)
    }
    
    if (timeFilter.value !== 'all') {
      const now = new Date()
      const filterTime = new Date()
      
      switch (timeFilter.value) {
        case '1h':
          filterTime.setHours(now.getHours() - 1)
          break
        case '24h':
          filterTime.setDate(now.getDate() - 1)
          break
        case '7d':
          filterTime.setDate(now.getDate() - 7)
          break
        case '30d':
          filterTime.setDate(now.getDate() - 30)
          break
      }
      
      if (timeFilter.value !== 'all') {
        filtered = filtered.filter(task => new Date(task.createdAt) >= filterTime)
      }
    }
    
    return filtered
  })

  const paginatedTasks = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredTasks.value.slice(start, end)
  })

  // Actions
  const fetchTasks = async (page = 1) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`/api/v1/tasks`, {
        params: {
          page,
          limit: pageSize.value,
          status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
          timeRange: timeFilter.value !== 'all' ? timeFilter.value : undefined
        }
      })
      
      tasks.value = response.data.tasks || []
      currentPage.value = response.data.currentPage || page
      totalPages.value = response.data.totalPages || 1
      totalTasks.value = response.data.total || 0
      
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch tasks'
      console.error('Error fetching tasks:', err)
    } finally {
      loading.value = false
    }
  }

  const connectWebSocket = () => {
    if (wsConnection.value) {
      wsConnection.value.close()
    }

    const wsUrl = `ws://localhost:3000/ws`
    wsConnection.value = new WebSocket(wsUrl)

    wsConnection.value.onopen = () => {
      wsConnected.value = true
      console.log('WebSocket connected')
    }

    wsConnection.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleWebSocketUpdate(data)
      } catch (err) {
        console.error('Error parsing WebSocket message:', err)
      }
    }

    wsConnection.value.onclose = () => {
      wsConnected.value = false
      console.log('WebSocket disconnected')
      // Attempt to reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000)
    }

    wsConnection.value.onerror = (error) => {
      console.error('WebSocket error:', error)
      wsConnected.value = false
    }
  }

  const handleWebSocketUpdate = (data) => {
    const { type, payload } = data

    switch (type) {
      case 'TASK_STATUS_UPDATE':
        updateTaskStatus(payload.taskId, payload.status, payload.progress)
        break
      case 'TASK_CREATED':
        addTask(payload.task)
        break
      case 'TASK_COMPLETED':
        updateTaskStatus(payload.taskId, 'completed', 100)
        if (payload.results) {
          updateTaskResults(payload.taskId, payload.results)
        }
        break
      case 'TASK_FAILED':
        updateTaskStatus(payload.taskId, 'failed', 0)
        if (payload.error) {
          updateTaskError(payload.taskId, payload.error)
        }
        break
      case 'TASK_CANCELLED':
        updateTaskStatus(payload.taskId, 'cancelled', 0)
        break
      case 'CHALLENGE_REQUIRED':
        updateTaskChallenge(payload.taskId, payload.challenge)
        break
    }
  }

  const updateTaskStatus = (taskId, status, progress) => {
    const taskIndex = tasks.value.findIndex(task => task.id === taskId)
    if (taskIndex !== -1) {
      tasks.value[taskIndex].status = status
      if (progress !== undefined) {
        tasks.value[taskIndex].progress = progress
      }
      tasks.value[taskIndex].updatedAt = new Date().toISOString()
    }
  }

  const updateTaskResults = (taskId, results) => {
    const taskIndex = tasks.value.findIndex(task => task.id === taskId)
    if (taskIndex !== -1) {
      tasks.value[taskIndex].results = results
      tasks.value[taskIndex].updatedAt = new Date().toISOString()
    }
  }

  const updateTaskError = (taskId, error) => {
    const taskIndex = tasks.value.findIndex(task => task.id === taskId)
    if (taskIndex !== -1) {
      tasks.value[taskIndex].error = error
      tasks.value[taskIndex].updatedAt = new Date().toISOString()
    }
  }

  const updateTaskChallenge = (taskId, challenge) => {
    const taskIndex = tasks.value.findIndex(task => task.id === taskId)
    if (taskIndex !== -1) {
      tasks.value[taskIndex].challenge = challenge
      tasks.value[taskIndex].status = 'challenge_required'
      tasks.value[taskIndex].updatedAt = new Date().toISOString()
    }
  }

  const addTask = (task) => {
    // Check if task already exists
    const existingIndex = tasks.value.findIndex(t => t.id === task.id)
    if (existingIndex === -1) {
      tasks.value.unshift(task)
      totalTasks.value += 1
    }
  }

  const cancelTask = async (taskId) => {
    try {
      await axios.post(`/api/v1/tasks/${taskId}/cancel`)
      updateTaskStatus(taskId, 'cancelling', 0)
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to cancel task'
      console.error('Error cancelling task:', err)
    }
  }

  const downloadResults = async (taskId) => {
    try {
      const response = await axios.get(`/api/v1/tasks/${taskId}/download`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `task-${taskId}-results.zip`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to download results'
      console.error('Error downloading results:', err)
    }
  }

  const setFilters = (filters) => {
    if (filters.status !== undefined) statusFilter.value = filters.status
    if (filters.time !== undefined) timeFilter.value = filters.time
    currentPage.value = 1
    fetchTasks(1)
  }

  const setPage = (page) => {
    currentPage.value = page
    fetchTasks(page)
  }

  const disconnectWebSocket = () => {
    if (wsConnection.value) {
      wsConnection.value.close()
      wsConnection.value = null
      wsConnected.value = false
    }
  }

  // Initialize
  const initialize = () => {
    fetchTasks()
    connectWebSocket()
  }

  return {
    // State
    tasks,
    loading,
    error,
    wsConnected,
    currentPage,
    totalPages,
    totalTasks,
    pageSize,
    statusFilter,
    timeFilter,
    
    // Computed
    filteredTasks,
    paginatedTasks,
    
    // Actions
    fetchTasks,
    cancelTask,
    downloadResults,
    setFilters,
    setPage,
    initialize,
    disconnectWebSocket,
    connectWebSocket
  }
})