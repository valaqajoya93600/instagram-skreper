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

describe('TaskMonitor - Core Functionality', () => {
  let wrapper

  beforeEach(() => {
    setActivePinia(createPinia())
    
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

  describe('Rendering States', () => {
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

    it('should show loading state when loading and no tasks', async () => {
      mockTaskStore.loading = true
      mockTaskStore.tasks = []
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.loading-state').exists()).toBe(true)
      expect(wrapper.find('.spinner').exists()).toBe(true)
      expect(wrapper.text()).toContain('Loading tasks...')
    })

    it('should show error state when there is an error', async () => {
      mockTaskStore.error = 'Network error occurred'
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.error-state').exists()).toBe(true)
      expect(wrapper.text()).toContain('Network error occurred')
      expect(wrapper.find('button').text()).toBe('Retry')
    })

    it('should show empty state when no tasks', async () => {
      mockTaskStore.loading = false
      mockTaskStore.paginatedTasks = []
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.text()).toContain('No tasks found')
    })

    it('should render tasks when available', async () => {
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

      mockTaskStore.paginatedTasks = mockTasks
      await wrapper.vm.$nextTick()
      
      const taskItems = wrapper.findAllComponents(TaskItem)
      expect(taskItems).toHaveLength(2)
      expect(taskItems[0].props('task')).toEqual(mockTasks[0])
      expect(taskItems[1].props('task')).toEqual(mockTasks[1])
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
})