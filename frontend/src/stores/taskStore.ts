import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { useApi } from '@/composables/useApi'
import { useWebSocket } from '@/composables/useWebSocket'
import type { Task } from '@/types'

export const useTaskStore = defineStore('task', () => {
  // State
  const tasks = ref<Task[]>([])
  const currentTask = ref<Task | null>(null)
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  })

  // Composables
  const api = useApi()
  const ws = useWebSocket()

  // Getters
  const tasksByStatus = computed(() => {
    const grouped: Record<string, Task[]> = {
      pending: [],
      running: [],
      completed: [],
      failed: [],
      cancelled: [],
    }

    tasks.value.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task)
      }
    })

    return grouped
  })

  const activeTasks = computed(() => 
    tasks.value.filter(task => task.status === 'pending' || task.status === 'running')
  )

  const completedTasks = computed(() => 
    tasks.value.filter(task => task.status === 'completed')
  )

  const failedTasks = computed(() => 
    tasks.value.filter(task => task.status === 'failed')
  )

  const tasksByType = computed(() => {
    const grouped: Record<string, Task[]> = {
      deployment: [],
      migration: [],
      scrape: [],
      custom: [],
    }

    tasks.value.forEach((task) => {
      if (grouped[task.type]) {
        grouped[task.type].push(task)
      }
    })

    return grouped
  })

  const getTaskById = computed(() => {
    return (id: string) => tasks.value.find(task => task.id === id)
  })

  const isLoading = computed(() => api.loading.value)

  // Actions
  const fetchTasks = async (page = 1, pageSize = 20) => {
    const { data, error } = await api.getTasks(page, pageSize)
    
    if (error) {
      throw new Error(error)
    }

    if (data) {
      tasks.value = data.items
      pagination.value = {
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
        totalPages: data.totalPages,
      }
    }
  }

  const fetchTask = async (id: string) => {
    const { data, error } = await api.getTask(id)
    
    if (error) {
      throw new Error(error)
    }

    if (data) {
      currentTask.value = data
      // Update task in the list if it exists
      const index = tasks.value.findIndex(task => task.id === id)
      if (index !== -1) {
        tasks.value[index] = data
      }
    }
  }

  const createTask = async (taskData: Partial<Task>) => {
    const { data, error } = await api.createTask(taskData)
    
    if (error) {
      throw new Error(error)
    }

    if (data) {
      tasks.value.unshift(data)
      return data
    }
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const { data, error } = await api.updateTask(id, updates)
    
    if (error) {
      throw new Error(error)
    }

    if (data) {
      const index = tasks.value.findIndex(task => task.id === id)
      if (index !== -1) {
        tasks.value[index] = data
      }
      if (currentTask.value?.id === id) {
        currentTask.value = data
      }
      return data
    }
  }

  const cancelTask = async (id: string) => {
    const { data, error } = await api.cancelTask(id)
    
    if (error) {
      throw new Error(error)
    }

    if (data) {
      const index = tasks.value.findIndex(task => task.id === id)
      if (index !== -1) {
        tasks.value[index] = data
      }
      if (currentTask.value?.id === id) {
        currentTask.value = data
      }
      return data
    }
  }

  const deleteTask = async (id: string) => {
    const { error } = await api.deleteTask(id)
    
    if (error) {
      throw new Error(error)
    }

    // Remove from state
    tasks.value = tasks.value.filter(task => task.id !== id)
    if (currentTask.value?.id === id) {
      currentTask.value = null
    }
  }

  const refreshTasks = () => {
    return fetchTasks(pagination.value.page, pagination.value.pageSize)
  }

  // WebSocket event handlers
  const setupWebSocketListeners = () => {
    const unsubscribe = ws.onTaskUpdate((updatedTask: Task) => {
      const index = tasks.value.findIndex(task => task.id === updatedTask.id)
      if (index !== -1) {
        tasks.value[index] = updatedTask
      } else {
        // New task, add to the beginning
        tasks.value.unshift(updatedTask)
      }

      // Update current task if it matches
      if (currentTask.value?.id === updatedTask.id) {
        currentTask.value = updatedTask
      }
    })

    return unsubscribe
  }

  // Initialize WebSocket listeners
  let wsUnsubscribe: (() => void) | null = null

  const initialize = async () => {
    try {
      await ws.connect()
      wsUnsubscribe = setupWebSocketListeners()
    } catch (error) {
      console.error('Failed to initialize task store WebSocket:', error)
    }
  }

  const cleanup = () => {
    if (wsUnsubscribe) {
      wsUnsubscribe()
      wsUnsubscribe = null
    }
  }

  return {
    // State
    tasks: readonly(tasks),
    currentTask: readonly(currentTask),
    pagination: readonly(pagination),
    
    // Getters
    tasksByStatus,
    activeTasks,
    completedTasks,
    failedTasks,
    tasksByType,
    getTaskById,
    isLoading,
    
    // Actions
    fetchTasks,
    fetchTask,
    createTask,
    updateTask,
    cancelTask,
    deleteTask,
    refreshTasks,
    initialize,
    cleanup,
  }
})