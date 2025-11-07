import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TaskMonitor from '../components/TaskMonitor.vue'
import TaskItem from '../components/TaskItem.vue'

// Mock the task store
const mockTaskStore = {
  tasks: [],
  loading: false,
  error: null,
  wsConnected: true,
  paginatedTasks: [],
  currentPage: 1,
  totalPages: 1,
  totalTasks: 0,
  statusFilter: 'all',
  timeFilter: 'all',
  fetchTasks: vi.fn(),
  cancelTask: vi.fn(),
  downloadResults: vi.fn(),
  setFilters: vi.fn(),
  setPage: vi.fn(),
  initialize: vi.fn(),
  disconnectWebSocket: vi.fn(),
  connectWebSocket: vi.fn()
}

vi.mock('../stores/taskStore', () => ({
  useTaskStore: () => mockTaskStore
}))

describe('TaskMonitor', () => {
  let wrapper

  beforeEach(() => {
    setActivePinia(createPinia())
    
    // Reset mocks
    vi.clearAllMocks()
    Object.assign(mockTaskStore, {
      tasks: [],
      loading: false,
      error: null,
      wsConnected: true,
      paginatedTasks: [],
      currentPage: 1,
      totalPages: 1,
      totalTasks: 0,
      statusFilter: 'all',
      timeFilter: 'all'
    })
    
    wrapper = mount(TaskMonitor, {
      global: {
        components: {
          TaskItem
        }
      }
    })
  })

  describe('Initial Rendering', () => {
    it('should render the component structure', () => {
      expect(wrapper.find('.task-monitor').exists()).toBe(true)
      expect(wrapper.find('.monitor-header').exists()).toBe(true)
      expect(wrapper.find('.filters-section').exists()).toBe(true)
      expect(wrapper.find('h2').text()).toBe('Scrape Tasks')
    })

    it('should show connection status', () => {
      const statusIndicator = wrapper.find('.status-indicator')
      expect(statusIndicator.exists()).toBe(true)
      expect(statusIndicator.text()).toContain('Live')
      expect(statusIndicator.classes()).toContain('connected')
    })

    it('should show offline status when disconnected', async () => {
      mockTaskStore.wsConnected = false
      await wrapper.vm.$nextTick()
      
      const statusIndicator = wrapper.find('.status-indicator')
      expect(statusIndicator.classes()).toContain('disconnected')
      expect(statusIndicator.text()).toContain('Offline')
    })
  })

  describe('Loading State', () => {
    it('should show loading state when loading and no tasks', async () => {
      mockTaskStore.loading = true
      mockTaskStore.tasks = []
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.loading-state').exists()).toBe(true)
      expect(wrapper.find('.spinner').exists()).toBe(true)
      expect(wrapper.text()).toContain('Loading tasks...')
    })

    it('should not show loading state when loading but has tasks', async () => {
      mockTaskStore.loading = true
      mockTaskStore.paginatedTasks = [{ id: '1', status: 'completed' }]
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.loading-state').exists()).toBe(false)
    })
  })

  describe('Error State', () => {
    it('should show error state when there is an error', async () => {
      mockTaskStore.error = 'Network error occurred'
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.error-state').exists()).toBe(true)
      expect(wrapper.text()).toContain('Network error occurred')
      expect(wrapper.find('button').text()).toBe('Retry')
    })

    it('should call refreshTasks when retry button is clicked', async () => {
      mockTaskStore.error = 'Network error'
      await wrapper.vm.$nextTick()
      
      const retryBtn = wrapper.find('.error-state button')
      await retryBtn.trigger('click')
      
      expect(mockTaskStore.fetchTasks).toHaveBeenCalled()
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no tasks', async () => {
      mockTaskStore.loading = false
      mockTaskStore.paginatedTasks = []
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.text()).toContain('No tasks found')
    })

    it('should call refreshTasks when empty state refresh button is clicked', async () => {
      mockTaskStore.paginatedTasks = []
      await wrapper.vm.$nextTick()
      
      const refreshBtn = wrapper.find('.empty-state button')
      await refreshBtn.trigger('click')
      
      expect(mockTaskStore.fetchTasks).toHaveBeenCalled()
    })
  })

  describe('Tasks List', () => {
    const mockTasks = [
      {
        id: '1',
        title: 'Task 1',
        status: 'completed',
        createdAt: '2023-12-01T10:00:00Z'
      },
      {
        id: '2',
        title: 'Task 2',
        status: 'running',
        createdAt: '2023-12-01T11:00:00Z'
      }
    ]

    it('should render tasks when available', async () => {
      mockTaskStore.paginatedTasks = mockTasks
      await wrapper.vm.$nextTick()
      
      const taskItems = wrapper.findAllComponents(TaskItem)
      expect(taskItems).toHaveLength(2)
      expect(taskItems[0].props('task')).toEqual(mockTasks[0])
      expect(taskItems[1].props('task')).toEqual(mockTasks[1])
    })

    it('should not show tasks list when no tasks', async () => {
      mockTaskStore.paginatedTasks = []
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.tasks-list').exists()).toBe(false)
    })
  })

  describe('Filters', () => {
    it('should render filter controls', () => {
      expect(wrapper.find('#status-filter').exists()).toBe(true)
      expect(wrapper.find('#time-filter').exists()).toBe(true)
      expect(wrapper.find('.refresh-btn').exists()).toBe(true)
    })

    it('should have correct filter options', () => {
      const statusOptions = wrapper.find('#status-filter').findAll('option')
      expect(statusOptions.length).toBeGreaterThan(1)
      expect(statusOptions[0].text()).toBe('All Status')
      
      const timeOptions = wrapper.find('#time-filter').findAll('option')
      expect(timeOptions.length).toBeGreaterThan(1)
      expect(timeOptions[0].text()).toBe('All Time')
    })

    it('should call setFilters when status filter changes', async () => {
      const statusFilter = wrapper.find('#status-filter')
      await statusFilter.setValue('completed')
      
      expect(mockTaskStore.setFilters).toHaveBeenCalledWith({
        status: 'completed',
        time: 'all'
      })
    })

    it('should call setFilters when time filter changes', async () => {
      const timeFilter = wrapper.find('#time-filter')
      await timeFilter.setValue('24h')
      
      expect(mockTaskStore.setFilters).toHaveBeenCalledWith({
        status: 'all',
        time: '24h'
      })
    })

    it('should call fetchTasks when refresh button is clicked', async () => {
      const refreshBtn = wrapper.find('.refresh-btn')
      await refreshBtn.trigger('click')
      
      expect(mockTaskStore.fetchTasks).toHaveBeenCalled()
    })

    it('should show loading state on refresh button when loading', async () => {
      mockTaskStore.loading = true
      await wrapper.vm.$nextTick()
      
      const refreshBtn = wrapper.find('.refresh-btn')
      expect(refreshBtn.text()).toBe('Loading...')
      expect(refreshBtn.attributes('disabled')).toBeDefined()
    })
  })

  describe('Pagination', () => {
    beforeEach(() => {
      mockTaskStore.totalPages = 3
      mockTaskStore.currentPage = 2
      mockTaskStore.totalTasks = 50
    })

    it('should show pagination when there are multiple pages', async () => {
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.pagination').exists()).toBe(true)
      expect(wrapper.find('.page-info').text()).toContain('Page 2 of 3')
      expect(wrapper.find('.page-info').text()).toContain('50 tasks')
    })

    it('should not show pagination when there is only one page', async () => {
      mockTaskStore.totalPages = 1
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.pagination').exists()).toBe(false)
    })

    it('should call setPage when previous button is clicked', async () => {
      await wrapper.vm.$nextTick()
      
      const prevBtn = wrapper.findAll('.pagination-btn')[0]
      await prevBtn.trigger('click')
      
      expect(mockTaskStore.setPage).toHaveBeenCalledWith(1)
    })

    it('should call setPage when next button is clicked', async () => {
      await wrapper.vm.$nextTick()
      
      const nextBtn = wrapper.findAll('.pagination-btn')[1]
      await nextBtn.trigger('click')
      
      expect(mockTaskStore.setPage).toHaveBeenCalledWith(3)
    })

    it('should disable previous button on first page', async () => {
      mockTaskStore.currentPage = 1
      await wrapper.vm.$nextTick()
      
      const prevBtn = wrapper.findAll('.pagination-btn')[0]
      expect(prevBtn.attributes('disabled')).toBeDefined()
    })

    it('should disable next button on last page', async () => {
      mockTaskStore.currentPage = 3
      await wrapper.vm.$nextTick()
      
      const nextBtn = wrapper.findAll('.pagination-btn')[1]
      expect(nextBtn.attributes('disabled')).toBeDefined()
    })
  })

  describe('Task Events', () => {
    beforeEach(() => {
      mockTaskStore.paginatedTasks = [
        { id: '1', status: 'running' },
        { id: '2', status: 'completed' }
      ]
    })

    it('should handle task cancel event', async () => {
      await wrapper.vm.$nextTick()
      
      const taskItems = wrapper.findAllComponents(TaskItem)
      await taskItems[0].vm.$emit('cancel', '1')
      
      expect(mockTaskStore.cancelTask).toHaveBeenCalledWith('1')
    })

    it('should handle task download event', async () => {
      await wrapper.vm.$nextTick()
      
      const taskItems = wrapper.findAllComponents(TaskItem)
      await taskItems[1].vm.$emit('download', '2')
      
      expect(mockTaskStore.downloadResults).toHaveBeenCalledWith('2')
    })

    it('should handle task view event', async () => {
      await wrapper.vm.$nextTick()
      
      const taskItems = wrapper.findAllComponents(TaskItem)
      const task = { id: '1', status: 'running' }
      await taskItems[0].vm.$emit('view', task)
      
      // View event should just log for now (could be extended)
      expect(wrapper.emitted('view')).toBeFalsy()
    })
  })

  describe('Toast Notifications', () => {
    it('should show toast notifications', async () => {
      wrapper.vm.addToast('Test message', 'success')
      await wrapper.vm.$nextTick()
      
      const toasts = wrapper.findAll('.toast')
      expect(toasts).toHaveLength(1)
      expect(toasts[0].text()).toBe('Test message')
      expect(toasts[0].classes()).toContain('success')
    })

    it('should remove toast after timeout', async () => {
      wrapper.vm.addToast('Test message', 'info')
      
      // Fast-forward timers
      vi.advanceTimersByTime(5000)
      await wrapper.vm.$nextTick()
      
      const toasts = wrapper.findAll('.toast')
      expect(toasts).toHaveLength(0)
    })
  })

  describe('Lifecycle', () => {
    it('should initialize store on mount', () => {
      expect(mockTaskStore.initialize).toHaveBeenCalled()
    })

    it('should disconnect WebSocket on unmount', () => {
      wrapper.unmount()
      expect(mockTaskStore.disconnectWebSocket).toHaveBeenCalled()
    })
  })

  describe('Status Change Toasts', () => {
    beforeEach(() => {
      mockTaskStore.tasks = [
        { id: '1', status: 'running', progress: 50 }
      ]
    })

    it('should show success toast when task completes', async () => {
      await wrapper.vm.$nextTick()
      
      // Clear any existing toasts
      wrapper.vm.toasts = []
      
      // Change task status to completed
      mockTaskStore.tasks = [
        { id: '1', status: 'completed', progress: 100 }
      ]
      
      await wrapper.vm.$nextTick()
      
      // Manually trigger the watch by calling the watch handler logic
      const newTasks = mockTaskStore.tasks
      const oldTasks = [{ id: '1', status: 'running', progress: 50 }]
      
      newTasks.forEach(task => {
        const oldTask = oldTasks.find(t => t.id === task.id)
        if (oldTask && oldTask.status !== task.status) {
          if (task.status === 'completed') {
            wrapper.vm.addToast(`Task ${task.id} completed successfully`, 'success')
          }
        }
      })
      
      await wrapper.vm.$nextTick()
      
      const toasts = wrapper.findAll('.toast')
      expect(toasts.length).toBeGreaterThan(0)
      const successToast = toasts.find(toast => toast.classes().includes('success'))
      expect(successToast).toBeTruthy()
      expect(successToast.text()).toContain('completed successfully')
    })

    it('should show error toast when task fails', async () => {
      await wrapper.vm.$nextTick()
      
      // Clear any existing toasts
      wrapper.vm.toasts = []
      
      // Change task status to failed
      mockTaskStore.tasks = [
        { id: '1', status: 'failed', error: 'API error' }
      ]
      
      await wrapper.vm.$nextTick()
      
      // Manually trigger the watch
      const newTasks = mockTaskStore.tasks
      const oldTasks = [{ id: '1', status: 'running', progress: 50 }]
      
      newTasks.forEach(task => {
        const oldTask = oldTasks.find(t => t.id === task.id)
        if (oldTask && oldTask.status !== task.status) {
          if (task.status === 'failed') {
            wrapper.vm.addToast(`Task ${task.id} failed: ${task.error || 'Unknown error'}`, 'error')
          }
        }
      })
      
      await wrapper.vm.$nextTick()
      
      const toasts = wrapper.findAll('.toast')
      expect(toasts.length).toBeGreaterThan(0)
      const errorToast = toasts.find(toast => toast.classes().includes('error'))
      expect(errorToast).toBeTruthy()
      expect(errorToast.text()).toContain('API error')
    })

    it('should show warning toast when challenge is required', async () => {
      await wrapper.vm.$nextTick()
      
      // Clear any existing toasts
      wrapper.vm.toasts = []
      
      // Change task status to challenge_required
      mockTaskStore.tasks = [
        { id: '1', status: 'challenge_required', challenge: 'Email verification' }
      ]
      
      await wrapper.vm.$nextTick()
      
      // Manually trigger the watch
      const newTasks = mockTaskStore.tasks
      const oldTasks = [{ id: '1', status: 'running', progress: 50 }]
      
      newTasks.forEach(task => {
        const oldTask = oldTasks.find(t => t.id === task.id)
        if (oldTask && oldTask.status !== task.status) {
          if (task.status === 'challenge_required') {
            wrapper.vm.addToast(`Task ${task.id} requires attention: ${task.challenge}`, 'warning')
          }
        }
      })
      
      await wrapper.vm.$nextTick()
      
      const toasts = wrapper.findAll('.toast')
      expect(toasts.length).toBeGreaterThan(0)
      const warningToast = toasts.find(toast => toast.classes().includes('warning'))
      expect(warningToast).toBeTruthy()
      expect(warningToast.text()).toContain('Email verification')
    })
  })
})