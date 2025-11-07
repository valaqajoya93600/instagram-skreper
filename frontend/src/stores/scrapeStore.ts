import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { useApi } from '@/composables/useApi'
import { useWebSocket } from '@/composables/useWebSocket'
import type { ScrapeJob } from '@/types'

export const useScrapeStore = defineStore('scrape', () => {
  // State
  const jobs = ref<ScrapeJob[]>([])
  const currentJob = ref<ScrapeJob | null>(null)
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  })

  // Form state for submission
  const form = ref({
    url: '',
    method: 'GET' as 'GET' | 'POST',
    headers: {} as Record<string, string>,
    body: '',
    selector: '',
    waitFor: '',
    screenshot: false,
    javascript: true,
  })

  // Composables
  const api = useApi()
  const ws = useWebSocket()

  // Getters
  const jobsByStatus = computed(() => {
    const grouped: Record<string, ScrapeJob[]> = {
      pending: [],
      running: [],
      completed: [],
      failed: [],
    }

    jobs.value.forEach((job) => {
      if (grouped[job.status]) {
        grouped[job.status].push(job)
      }
    })

    return grouped
  })

  const activeJobs = computed(() => 
    jobs.value.filter(job => job.status === 'pending' || job.status === 'running')
  )

  const completedJobs = computed(() => 
    jobs.value.filter(job => job.status === 'completed')
  )

  const failedJobs = computed(() => 
    jobs.value.filter(job => job.status === 'failed')
  )

  const getJobById = computed(() => {
    return (id: string) => jobs.value.find(job => job.id === id)
  })

  const isLoading = computed(() => api.loading.value)

  const formIsValid = computed(() => {
    return form.value.url.trim() !== '' && 
           (form.value.method === 'GET' || form.value.body.trim() !== '')
  })

  // Actions
  const fetchJobs = async (page = 1, pageSize = 20) => {
    const { data, error } = await api.getScrapeJobs(page, pageSize)
    
    if (error) {
      throw new Error(error)
    }

    if (data) {
      jobs.value = data.items
      pagination.value = {
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
        totalPages: data.totalPages,
      }
    }
  }

  const fetchJob = async (id: string) => {
    const { data, error } = await api.getScrapeJob(id)
    
    if (error) {
      throw new Error(error)
    }

    if (data) {
      currentJob.value = data
      // Update job in the list if it exists
      const index = jobs.value.findIndex(job => job.id === id)
      if (index !== -1) {
        jobs.value[index] = data
      }
    }
  }

  const submitJob = async (jobData?: Partial<ScrapeJob>) => {
    const dataToSubmit = jobData || {
      url: form.value.url,
      method: form.value.method,
      headers: form.value.headers,
      body: form.value.body,
      selector: form.value.selector,
      waitFor: form.value.waitFor,
      screenshot: form.value.screenshot,
      javascript: form.value.javascript,
    }

    const { data, error } = await api.submitScrapeJob(dataToSubmit)
    
    if (error) {
      throw new Error(error)
    }

    if (data) {
      jobs.value.unshift(data)
      resetForm()
      return data
    }
  }

  const cancelJob = async (id: string) => {
    const { data, error } = await api.cancelScrapeJob(id)
    
    if (error) {
      throw new Error(error)
    }

    if (data) {
      const index = jobs.value.findIndex(job => job.id === id)
      if (index !== -1) {
        jobs.value[index] = data
      }
      if (currentJob.value?.id === id) {
        currentJob.value = data
      }
      return data
    }
  }

  const deleteJob = async (id: string) => {
    const { error } = await api.deleteScrapeJob(id)
    
    if (error) {
      throw new Error(error)
    }

    // Remove from state
    jobs.value = jobs.value.filter(job => job.id !== id)
    if (currentJob.value?.id === id) {
      currentJob.value = null
    }
  }

  const refreshJobs = () => {
    return fetchJobs(pagination.value.page, pagination.value.pageSize)
  }

  // Form actions
  const updateForm = (updates: Partial<typeof form.value>) => {
    Object.assign(form.value, updates)
  }

  const setFormHeader = (key: string, value: string) => {
    if (value.trim() === '') {
      delete form.value.headers[key]
    } else {
      form.value.headers[key] = value
    }
  }

  const removeFormHeader = (key: string) => {
    delete form.value.headers[key]
  }

  const resetForm = () => {
    form.value = {
      url: '',
      method: 'GET',
      headers: {},
      body: '',
      selector: '',
      waitFor: '',
      screenshot: false,
      javascript: true,
    }
  }

  const loadJobIntoForm = (job: ScrapeJob) => {
    form.value = {
      url: job.url,
      method: job.method,
      headers: job.headers || {},
      body: job.body || '',
      selector: job.selector || '',
      waitFor: job.waitFor || '',
      screenshot: job.screenshot || false,
      javascript: job.javascript !== false, // Default to true if undefined
    }
  }

  // WebSocket event handlers
  const setupWebSocketListeners = () => {
    const unsubscribe = ws.onScrapeUpdate((updatedJob: ScrapeJob) => {
      const index = jobs.value.findIndex(job => job.id === updatedJob.id)
      if (index !== -1) {
        jobs.value[index] = updatedJob
      } else {
        // New job, add to the beginning
        jobs.value.unshift(updatedJob)
      }

      // Update current job if it matches
      if (currentJob.value?.id === updatedJob.id) {
        currentJob.value = updatedJob
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
      console.error('Failed to initialize scrape store WebSocket:', error)
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
    jobs: readonly(jobs),
    currentJob: readonly(currentJob),
    pagination: readonly(pagination),
    form: readonly(form),
    
    // Getters
    jobsByStatus,
    activeJobs,
    completedJobs,
    failedJobs,
    getJobById,
    isLoading,
    formIsValid,
    
    // Actions
    fetchJobs,
    fetchJob,
    submitJob,
    cancelJob,
    deleteJob,
    refreshJobs,
    updateForm,
    setFormHeader,
    removeFormHeader,
    resetForm,
    loadJobIntoForm,
    initialize,
    cleanup,
  }
})