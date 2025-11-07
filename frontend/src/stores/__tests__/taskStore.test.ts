import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from '../taskStore'
import type { Task } from '@/types'

// Mock the composables
const mockExecute = vi.fn()
vi.mock('@/composables/useApi', () => ({
  useApi: () => ({
    loading: { value: false },
    execute: mockExecute,
    getTasks: vi.fn(),
    getTask: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    cancelTask: vi.fn(),
    deleteTask: vi.fn(),
  }),
}))

vi.mock('@/composables/useWebSocket', () => ({
  useWebSocket: () => ({
    connect: vi.fn(),
    onTaskUpdate: vi.fn(() => vi.fn()),
  }),
}))

describe('TaskStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with empty state', () => {
    const store = useTaskStore()
    
    expect(store.tasks).toEqual([])
    expect(store.currentTask).toBe(null)
    expect(store.pagination.page).toBe(1)
    expect(store.pagination.pageSize).toBe(20)
    expect(store.pagination.total).toBe(0)
    expect(store.pagination.totalPages).toBe(0)
  })

  it('should group tasks by status correctly', () => {
    const store = useTaskStore()
    const mockTasks: Task[] = [
      {
        id: '1',
        name: 'Task 1',
        type: 'deployment',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Task 2',
        type: 'migration',
        status: 'running',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: 'Task 3',
        type: 'scrape',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '4',
        name: 'Task 4',
        type: 'custom',
        status: 'failed',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    // Simulate setting tasks directly for testing
    store.tasks = mockTasks

    const grouped = store.tasksByStatus
    expect(grouped.pending).toHaveLength(1)
    expect(grouped.running).toHaveLength(1)
    expect(grouped.completed).toHaveLength(1)
    expect(grouped.failed).toHaveLength(1)
    expect(grouped.pending[0].id).toBe('1')
    expect(grouped.running[0].id).toBe('2')
    expect(grouped.completed[0].id).toBe('3')
    expect(grouped.failed[0].id).toBe('4')
  })

  it('should identify active tasks correctly', () => {
    const store = useTaskStore()
    const mockTasks: Task[] = [
      {
        id: '1',
        name: 'Task 1',
        type: 'deployment',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Task 2',
        type: 'migration',
        status: 'running',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: 'Task 3',
        type: 'scrape',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    store.tasks = mockTasks
    const activeTasks = store.activeTasks
    
    expect(activeTasks).toHaveLength(2)
    expect(activeTasks.map(t => t.id)).toEqual(['1', '2'])
  })

  it('should group tasks by type correctly', () => {
    const store = useTaskStore()
    const mockTasks: Task[] = [
      {
        id: '1',
        name: 'Task 1',
        type: 'deployment',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Task 2',
        type: 'migration',
        status: 'running',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: 'Task 3',
        type: 'scrape',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '4',
        name: 'Task 4',
        type: 'custom',
        status: 'failed',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    store.tasks = mockTasks
    const grouped = store.tasksByType
    
    expect(grouped.deployment).toHaveLength(1)
    expect(grouped.migration).toHaveLength(1)
    expect(grouped.scrape).toHaveLength(1)
    expect(grouped.custom).toHaveLength(1)
    expect(grouped.deployment[0].id).toBe('1')
    expect(grouped.migration[0].id).toBe('2')
    expect(grouped.scrape[0].id).toBe('3')
    expect(grouped.custom[0].id).toBe('4')
  })

  it('should find task by ID correctly', () => {
    const store = useTaskStore()
    const mockTasks: Task[] = [
      {
        id: '1',
        name: 'Task 1',
        type: 'deployment',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Task 2',
        type: 'migration',
        status: 'running',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    store.tasks = mockTasks
    const foundTask = store.getTaskById('2')
    
    expect(foundTask).toBeDefined()
    expect(foundTask?.id).toBe('2')
    expect(foundTask?.name).toBe('Task 2')

    const notFoundTask = store.getTaskById('999')
    expect(notFoundTask).toBeUndefined()
  })

  it('should handle task creation', async () => {
    const store = useTaskStore()
    
    const newTask: Task = {
      id: 'new-task',
      name: 'New Task',
      type: 'deployment',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockExecute.mockResolvedValue({ data: newTask, error: null })

    const result = await store.createTask({
      name: 'New Task',
      type: 'deployment',
    })

    expect(result).toEqual(newTask)
    expect(store.tasks).toContainEqual(newTask)
  })

  it('should handle task updates', async () => {
    const store = useTaskStore()
    
    const existingTask: Task = {
      id: '1',
      name: 'Task 1',
      type: 'deployment',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const updatedTask: Task = {
      ...existingTask,
      name: 'Updated Task 1',
      status: 'running',
      updatedAt: new Date(),
    }

    store.tasks = [existingTask]
    mockExecute.mockResolvedValue({ data: updatedTask, error: null })

    const result = await store.updateTask('1', {
      name: 'Updated Task 1',
      status: 'running',
    })

    expect(result).toEqual(updatedTask)
    expect(store.tasks[0]).toEqual(updatedTask)
  })

  it('should handle task deletion', async () => {
    const store = useTaskStore()
    
    const taskToDelete: Task = {
      id: '1',
      name: 'Task 1',
      type: 'deployment',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    store.tasks = [taskToDelete]
    store.currentTask = taskToDelete
    mockExecute.mockResolvedValue({ error: null })

    await store.deleteTask('1')

    expect(store.tasks).toHaveLength(0)
    expect(store.currentTask).toBe(null)
  })

  it('should handle WebSocket task updates', async () => {
    const store = useTaskStore()
    
    // Mock the WebSocket service directly
    const mockOnTaskUpdate = vi.fn()
    // const mockConnect = vi.fn().mockResolvedValue(undefined) // Not used
    
    let taskUpdateHandler: ((task: Task) => void) | null = null
    
    mockOnTaskUpdate.mockImplementation((handler) => {
      taskUpdateHandler = handler as (task: Task) => void
      return vi.fn()
    })

    store.initialize()
    
    expect(mockOnTaskUpdate).toHaveBeenCalled()
    expect(taskUpdateHandler).not.toBeNull()

    if (taskUpdateHandler) {
      const updatedTask: Task = {
        id: '1',
        name: 'Updated Task',
        type: 'deployment',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      }

      // taskUpdateHandler(updatedTask) // Not called in test

      expect(store.tasks).toContainEqual(updatedTask)
    }
  })
})