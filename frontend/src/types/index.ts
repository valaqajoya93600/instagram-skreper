export interface Task {
  id: string
  name: string
  type: 'deployment' | 'migration' | 'scrape' | 'custom'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
  startedAt?: Date
  completedAt?: Date
  result?: TaskResult
  error?: string
  metadata?: Record<string, any>
}

export interface TaskResult {
  success: boolean
  data?: any
  message?: string
  metrics?: Record<string, number>
}

export interface ScrapeJob {
  id: string
  url: string
  method: 'GET' | 'POST'
  headers?: Record<string, string>
  body?: string
  selector?: string
  waitFor?: string
  screenshot?: boolean
  javascript?: boolean
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  result?: ScrapeResult
  error?: string
}

export interface ScrapeResult {
  html?: string
  text?: string
  data?: any
  screenshot?: string
  links?: string[]
  metadata?: Record<string, any>
}

export interface WebSocketMessage {
  type: 'task_update' | 'scrape_update' | 'notification' | 'error'
  data: any
  timestamp: Date
}

export interface UiPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  notifications: {
    enabled: boolean
    taskUpdates: boolean
    scrapeUpdates: boolean
    errors: boolean
  }
  layout: {
    sidebarCollapsed: boolean
    pageSize: number
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}