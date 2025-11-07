import { ref, readonly } from 'vue'
import { apiService } from '@/services/api'
import type { Task, ScrapeJob } from '@/types'

export function useApi() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const execute = async <T>(
    apiCall: () => Promise<T>
  ): Promise<{ data: T | null; error: string | null }> => {
    loading.value = true
    error.value = null

    try {
      const result = await apiCall()
      return { data: result, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      error.value = errorMessage
      return { data: null, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    execute,
    // Task methods
    getTasks: (page?: number, pageSize?: number) =>
      execute(() => apiService.getTasks(page, pageSize)),
    getTask: (id: string) => execute(() => apiService.getTask(id)),
    createTask: (taskData: Partial<Task>) =>
      execute(() => apiService.createTask(taskData)),
    updateTask: (id: string, updates: Partial<Task>) =>
      execute(() => apiService.updateTask(id, updates)),
    cancelTask: (id: string) => execute(() => apiService.cancelTask(id)),
    deleteTask: (id: string) => execute(() => apiService.deleteTask(id)),
    // Scrape methods
    getScrapeJobs: (page?: number, pageSize?: number) =>
      execute(() => apiService.getScrapeJobs(page, pageSize)),
    getScrapeJob: (id: string) => execute(() => apiService.getScrapeJob(id)),
    submitScrapeJob: (jobData: Partial<ScrapeJob>) =>
      execute(() => apiService.submitScrapeJob(jobData)),
    cancelScrapeJob: (id: string) => execute(() => apiService.cancelScrapeJob(id)),
    deleteScrapeJob: (id: string) => execute(() => apiService.deleteScrapeJob(id)),
  }
}