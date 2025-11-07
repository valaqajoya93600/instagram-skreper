import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from '../stores/taskStore'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

describe('TaskStore - Core Functionality', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTaskStore()
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(store.tasks).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
      expect(store.wsConnected).toBe(false)
      expect(store.currentPage).toBe(1)
      expect(store.totalPages).toBe(1)
      expect(store.totalTasks).toBe(0)
      expect(store.statusFilter).toBe('all')
      expect(store.timeFilter).toBe('all')
    })
  })

  describe('fetchTasks', () => {
    it('should fetch tasks successfully', async () => {
      const mockResponse = {
        data: {
          tasks: [
            { id: '1', status: 'completed', title: 'Test Task 1' },
            { id: '2', status: 'running', title: 'Test Task 2' }
          ],
          currentPage: 1,
          totalPages: 2,
          total: 15
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      await store.fetchTasks()

      expect(store.loading).toBe(false)
      expect(store.tasks).toEqual(mockResponse.data.tasks)
      expect(store.currentPage).toBe(1)
      expect(store.totalPages).toBe(2)
      expect(store.totalTasks).toBe(15)
      expect(store.error).toBe(null)
    })

    it('should handle fetch errors', async () => {
      const errorMessage = 'Network error'
      mockedAxios.get.mockRejectedValue({
        response: { data: { message: errorMessage } }
      })

      await store.fetchTasks()

      expect(store.loading).toBe(false)
      expect(store.error).toBe(errorMessage)
      expect(store.tasks).toEqual([])
    })
  })

  describe('Task Actions', () => {
    it('should cancel task successfully', async () => {
      store.tasks = [{ id: '1', status: 'running' }]
      mockedAxios.post.mockResolvedValue({})

      await store.cancelTask('1')

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/v1/tasks/1/cancel')
      expect(store.tasks[0].status).toBe('cancelling')
    })

    it('should handle cancel task error', async () => {
      store.tasks = [{ id: '1', status: 'running' }]
      mockedAxios.post.mockRejectedValue({
        response: { data: { message: 'Cannot cancel task' } }
      })

      await store.cancelTask('1')

      expect(store.error).toBe('Cannot cancel task')
    })
  })

  describe('Filters', () => {
    beforeEach(() => {
      store.tasks = [
        { id: '1', status: 'completed', createdAt: '2023-01-01T00:00:00Z' },
        { id: '2', status: 'running', createdAt: new Date().toISOString() },
        { id: '3', status: 'failed', createdAt: '2023-12-01T00:00:00Z' }
      ]
      mockedAxios.get.mockResolvedValue({ data: { tasks: [], currentPage: 1, totalPages: 1, total: 0 } })
    })

    it('should filter by status', () => {
      store.statusFilter = 'completed'
      
      const filtered = store.filteredTasks
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('1')
    })

    it('should apply filters and fetch tasks', async () => {
      await store.setFilters({ status: 'completed', time: '7d' })

      expect(store.statusFilter).toBe('completed')
      expect(store.timeFilter).toBe('7d')
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/tasks', {
        params: {
          page: 1,
          limit: 20,
          status: 'completed',
          timeRange: '7d'
        }
      })
    })
  })

  describe('Computed Properties', () => {
    beforeEach(() => {
      store.tasks = [
        { id: '1', status: 'completed', createdAt: new Date().toISOString() },
        { id: '2', status: 'running', createdAt: '2023-01-01T00:00:00Z' },
        { id: '3', status: 'completed', createdAt: new Date().toISOString() }
      ]
    })

    it('should compute filtered tasks correctly', () => {
      store.statusFilter = 'completed'
      
      const filtered = store.filteredTasks
      
      expect(filtered).toHaveLength(2)
      expect(filtered.every(task => task.status === 'completed')).toBe(true)
    })

    it('should compute paginated tasks correctly', () => {
      store.pageSize = 2
      
      const paginated = store.paginatedTasks
      
      expect(paginated).toHaveLength(2)
      expect(paginated[0].id).toBe('1')
      expect(paginated[1].id).toBe('2')
    })
  })

  describe('WebSocket Message Handling', () => {
    it('should handle task status update', () => {
      store.tasks = [{ id: '1', status: 'running', progress: 50 }]
      
      store.handleWebSocketUpdate({
        type: 'TASK_STATUS_UPDATE',
        payload: { taskId: '1', status: 'completed', progress: 100 }
      })

      expect(store.tasks[0].status).toBe('completed')
      expect(store.tasks[0].progress).toBe(100)
    })

    it('should handle task creation', () => {
      store.tasks = []
      
      store.handleWebSocketUpdate({
        type: 'TASK_CREATED',
        payload: { task: { id: '2', status: 'pending', title: 'New Task' } }
      })

      expect(store.tasks).toHaveLength(1)
      expect(store.tasks[0].id).toBe('2')
      expect(store.tasks[0].status).toBe('pending')
    })

    it('should handle task completion with results', () => {
      store.tasks = [{ id: '1', status: 'running' }]
      
      store.handleWebSocketUpdate({
        type: 'TASK_COMPLETED',
        payload: { 
          taskId: '1', 
          results: { count: 100, fileSize: 1024 } 
        }
      })

      expect(store.tasks[0].status).toBe('completed')
      expect(store.tasks[0].results).toEqual({ count: 100, fileSize: 1024 })
    })

    it('should handle task failure', () => {
      store.tasks = [{ id: '1', status: 'running' }]
      
      store.handleWebSocketUpdate({
        type: 'TASK_FAILED',
        payload: { 
          taskId: '1', 
          error: 'Instagram API error' 
        }
      })

      expect(store.tasks[0].status).toBe('failed')
      expect(store.tasks[0].error).toBe('Instagram API error')
    })

    it('should handle challenge requirement', () => {
      store.tasks = [{ id: '1', status: 'running' }]
      
      store.handleWebSocketUpdate({
        type: 'CHALLENGE_REQUIRED',
        payload: { 
          taskId: '1', 
          challenge: 'Please verify your email' 
        }
      })

      expect(store.tasks[0].status).toBe('challenge_required')
      expect(store.tasks[0].challenge).toBe('Please verify your email')
    })
  })
})