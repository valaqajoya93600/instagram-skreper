import { createPinia } from 'pinia'

const pinia = createPinia()

export { pinia }

// Export all stores
export { useTaskStore } from './taskStore'
export { useScrapeStore } from './scrapeStore'
export { useUiStore } from './uiStore'

// Export types
export type * from '@/types'