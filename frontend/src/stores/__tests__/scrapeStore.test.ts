import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useScrapeStore } from '../scrapeStore'
import type { ScrapeJob } from '@/types'

// Mock the composables
vi.mock('@/composables/useApi', () => ({
  useApi: () => ({
    loading: { value: false },
    getScrapeJobs: vi.fn(),
    getScrapeJob: vi.fn(),
    submitScrapeJob: vi.fn(),
    cancelScrapeJob: vi.fn(),
    deleteScrapeJob: vi.fn(),
  }),
}))

vi.mock('@/composables/useWebSocket', () => ({
  useWebSocket: () => ({
    connect: vi.fn(),
    onScrapeUpdate: vi.fn(() => vi.fn()),
  }),
}))

describe('ScrapeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with empty state and default form', () => {
    const store = useScrapeStore()
    
    expect(store.jobs).toEqual([])
    expect(store.currentJob).toBe(null)
    expect(store.pagination.page).toBe(1)
    expect(store.pagination.pageSize).toBe(20)
    expect(store.pagination.total).toBe(0)
    expect(store.pagination.totalPages).toBe(0)
    
    expect(store.form.url).toBe('')
    expect(store.form.method).toBe('GET')
    expect(store.form.headers).toEqual({})
    expect(store.form.body).toBe('')
    expect(store.form.screenshot).toBe(false)
    expect(store.form.javascript).toBe(true)
  })

  it('should validate form correctly', () => {
    const store = useScrapeStore()
    
    // Empty URL should be invalid
    expect(store.formIsValid).toBe(false)
    
    // Valid GET request
    store.updateForm({ url: 'https://example.com' })
    expect(store.formIsValid).toBe(true)
    
    // POST request without body should be invalid
    store.updateForm({ method: 'POST' })
    expect(store.formIsValid).toBe(false)
    
    // POST request with body should be valid
    store.updateForm({ body: 'test data' })
    expect(store.formIsValid).toBe(true)
  })

  it('should group jobs by status correctly', () => {
    const store = useScrapeStore()
    const mockJobs: ScrapeJob[] = [
      {
        id: '1',
        url: 'https://example1.com',
        method: 'GET',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        url: 'https://example2.com',
        method: 'POST',
        status: 'running',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        url: 'https://example3.com',
        method: 'GET',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      },
      {
        id: '4',
        url: 'https://example4.com',
        method: 'GET',
        status: 'failed',
        createdAt: new Date(),
        updatedAt: new Date(),
        error: 'Timeout',
      },
    ]

    store.jobs = mockJobs
    const grouped = store.jobsByStatus
    
    expect(grouped.pending).toHaveLength(1)
    expect(grouped.running).toHaveLength(1)
    expect(grouped.completed).toHaveLength(1)
    expect(grouped.failed).toHaveLength(1)
    expect(grouped.pending[0].id).toBe('1')
    expect(grouped.running[0].id).toBe('2')
    expect(grouped.completed[0].id).toBe('3')
    expect(grouped.failed[0].id).toBe('4')
  })

  it('should identify active jobs correctly', () => {
    const store = useScrapeStore()
    const mockJobs: ScrapeJob[] = [
      {
        id: '1',
        url: 'https://example1.com',
        method: 'GET',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        url: 'https://example2.com',
        method: 'POST',
        status: 'running',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        url: 'https://example3.com',
        method: 'GET',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      },
    ]

    store.jobs = mockJobs
    const activeJobs = store.activeJobs
    
    expect(activeJobs).toHaveLength(2)
    expect(activeJobs.map(j => j.id)).toEqual(['1', '2'])
  })

  it('should find job by ID correctly', () => {
    const store = useScrapeStore()
    const mockJobs: ScrapeJob[] = [
      {
        id: '1',
        url: 'https://example1.com',
        method: 'GET',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        url: 'https://example2.com',
        method: 'POST',
        status: 'running',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    store.jobs = mockJobs
    const foundJob = store.getJobById('2')
    
    expect(foundJob).toBeDefined()
    expect(foundJob?.id).toBe('2')
    expect(foundJob?.url).toBe('https://example2.com')

    const notFoundJob = store.getJobById('999')
    expect(notFoundJob).toBeUndefined()
  })

  it('should handle form updates', () => {
    const store = useScrapeStore()
    
    store.updateForm({
      url: 'https://example.com',
      method: 'POST',
      screenshot: true,
    })
    
    expect(store.form.url).toBe('https://example.com')
    expect(store.form.method).toBe('POST')
    expect(store.form.screenshot).toBe(true)
    expect(store.form.javascript).toBe(true) // Should remain unchanged
  })

  it('should handle form headers correctly', () => {
    const store = useScrapeStore()
    
    store.setFormHeader('Authorization', 'Bearer token123')
    expect(store.form.headers['Authorization']).toBe('Bearer token123')
    
    store.setFormHeader('Content-Type', 'application/json')
    expect(store.form.headers['Content-Type']).toBe('application/json')
    expect(store.form.headers['Authorization']).toBe('Bearer token123')
    
    store.removeFormHeader('Authorization')
    expect(store.form.headers['Authorization']).toBeUndefined()
    expect(store.form.headers['Content-Type']).toBe('application/json')
  })

  it('should reset form correctly', () => {
    const store = useScrapeStore()
    
    store.updateForm({
      url: 'https://example.com',
      method: 'POST',
      body: 'test',
      headers: { 'Authorization': 'Bearer token' },
      screenshot: true,
      javascript: false,
    })
    
    store.resetForm()
    
    expect(store.form.url).toBe('')
    expect(store.form.method).toBe('GET')
    expect(store.form.body).toBe('')
    expect(store.form.headers).toEqual({})
    expect(store.form.screenshot).toBe(false)
    expect(store.form.javascript).toBe(true)
  })

  it('should load job into form correctly', () => {
    const store = useScrapeStore()
    
    const job: ScrapeJob = {
      id: '1',
      url: 'https://example.com',
      method: 'POST',
      headers: { 'Authorization': 'Bearer token' },
      body: 'test data',
      selector: '.content',
      waitFor: '.loaded',
      screenshot: true,
      javascript: false,
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: new Date(),
    }
    
    store.loadJobIntoForm(job)
    
    expect(store.form.url).toBe('https://example.com')
    expect(store.form.method).toBe('POST')
    expect(store.form.headers).toEqual({ 'Authorization': 'Bearer token' })
    expect(store.form.body).toBe('test data')
    expect(store.form.selector).toBe('.content')
    expect(store.form.waitFor).toBe('.loaded')
    expect(store.form.screenshot).toBe(true)
    expect(store.form.javascript).toBe(false)
  })

  it('should handle job submission', async () => {
    const store = useScrapeStore()
    const { useApi } = await import('@/composables/useApi')
    const mockSubmit = vi.mocked(useApi().submitScrapeJob)
    
    store.updateForm({
      url: 'https://example.com',
      method: 'GET',
      screenshot: true,
    })
    
    const newJob: ScrapeJob = {
      id: 'new-job',
      url: 'https://example.com',
      method: 'GET',
      screenshot: true,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockSubmit.mockResolvedValue({ data: newJob, error: null })

    const result = await store.submitJob()

    expect(mockSubmit).toHaveBeenCalledWith({
      url: 'https://example.com',
      method: 'GET',
      headers: {},
      body: '',
      selector: '',
      waitFor: '',
      screenshot: true,
      javascript: true,
    })
    expect(result).toEqual(newJob)
    expect(store.jobs).toContainEqual(newJob)
    expect(store.form.url).toBe('') // Form should be reset
  })

  it('should handle job cancellation', async () => {
    const store = useScrapeStore()
    const { useApi } = await import('@/composables/useApi')
    const mockCancel = vi.mocked(useApi().cancelScrapeJob)
    
    const existingJob: ScrapeJob = {
      id: '1',
      url: 'https://example.com',
      method: 'GET',
      status: 'running',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const cancelledJob: ScrapeJob = {
      ...existingJob,
      status: 'cancelled',
      updatedAt: new Date(),
    }

    store.jobs = [existingJob]
    store.currentJob = existingJob
    mockCancel.mockResolvedValue({ data: cancelledJob, error: null })

    const result = await store.cancelJob('1')

    expect(mockCancel).toHaveBeenCalledWith('1')
    expect(result).toEqual(cancelledJob)
    expect(store.jobs[0]).toEqual(cancelledJob)
    expect(store.currentJob).toEqual(cancelledJob)
  })

  it('should handle job deletion', async () => {
    const store = useScrapeStore()
    const { useApi } = await import('@/composables/useApi')
    const mockDelete = vi.mocked(useApi().deleteScrapeJob)
    
    const jobToDelete: ScrapeJob = {
      id: '1',
      url: 'https://example.com',
      method: 'GET',
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    store.jobs = [jobToDelete]
    store.currentJob = jobToDelete
    mockDelete.mockResolvedValue({ data: undefined, error: null })

    await store.deleteJob('1')

    expect(mockDelete).toHaveBeenCalledWith('1')
    expect(store.jobs).toHaveLength(0)
    expect(store.currentJob).toBe(null)
  })

  it('should handle WebSocket job updates', async () => {
    const store = useScrapeStore()
    const { useWebSocket } = await import('@/composables/useWebSocket')
    const mockOnScrapeUpdate = vi.mocked(useWebSocket().onScrapeUpdate)
    
    let jobUpdateHandler: ((job: ScrapeJob) => void) | null = null
    
    mockOnScrapeUpdate.mockImplementation((handler) => {
      jobUpdateHandler = handler as (job: ScrapeJob) => void
      return vi.fn()
    })

    store.initialize()
    
    expect(mockOnScrapeUpdate).toHaveBeenCalled()
    expect(jobUpdateHandler).not.toBeNull()

    if (jobUpdateHandler) {
      const updatedJob: ScrapeJob = {
        id: '1',
        url: 'https://example.com',
        method: 'GET',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
        result: {
          html: '<html>...</html>',
          text: 'Some text content',
        },
      }

      // jobUpdateHandler(updatedJob) // Not called in test

      expect(store.jobs).toContainEqual(updatedJob)
    }
  })
})