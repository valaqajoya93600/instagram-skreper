import type { ApiResponse, PaginatedResponse, Task, ScrapeJob } from '@/types'

const API_BASE_URL = '/api'

class ApiService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  // Task API methods
  async getTasks(page = 1, pageSize = 20): Promise<PaginatedResponse<Task>> {
    const response = await this.request<PaginatedResponse<Task>>(`/tasks?page=${page}&pageSize=${pageSize}`)
    return response.data || { items: [], total: 0, page, pageSize, totalPages: 0 }
  }

  async getTask(id: string): Promise<Task> {
    const response = await this.request<Task>(`/tasks/${id}`)
    return response.data!
  }

  async createTask(taskData: Partial<Task>): Promise<Task> {
    const response = await this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    })
    return response.data!
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const response = await this.request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
    return response.data!
  }

  async cancelTask(id: string): Promise<Task> {
    const response = await this.request<Task>(`/tasks/${id}/cancel`, {
      method: 'POST',
    })
    return response.data!
  }

  async deleteTask(id: string): Promise<void> {
    await this.request(`/tasks/${id}`, {
      method: 'DELETE',
    })
  }

  // Scrape API methods
  async getScrapeJobs(page = 1, pageSize = 20): Promise<PaginatedResponse<ScrapeJob>> {
    const response = await this.request<PaginatedResponse<ScrapeJob>>(`/scrape/jobs?page=${page}&pageSize=${pageSize}`)
    return response.data || { items: [], total: 0, page, pageSize, totalPages: 0 }
  }

  async getScrapeJob(id: string): Promise<ScrapeJob> {
    const response = await this.request<ScrapeJob>(`/scrape/jobs/${id}`)
    return response.data!
  }

  async submitScrapeJob(jobData: Partial<ScrapeJob>): Promise<ScrapeJob> {
    const response = await this.request<ScrapeJob>('/scrape/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    })
    return response.data!
  }

  async cancelScrapeJob(id: string): Promise<ScrapeJob> {
    const response = await this.request<ScrapeJob>(`/scrape/jobs/${id}/cancel`, {
      method: 'POST',
    })
    return response.data!
  }

  async deleteScrapeJob(id: string): Promise<void> {
    await this.request(`/scrape/jobs/${id}`, {
      method: 'DELETE',
    })
  }
}

export const apiService = new ApiService()