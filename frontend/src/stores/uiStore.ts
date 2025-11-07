import { defineStore } from 'pinia'
import { ref, computed, watch, readonly } from 'vue'
import type { UiPreferences } from '@/types'

const DEFAULT_PREFERENCES: UiPreferences = {
  theme: 'auto',
  language: 'en',
  notifications: {
    enabled: true,
    taskUpdates: true,
    scrapeUpdates: true,
    errors: true,
  },
  layout: {
    sidebarCollapsed: false,
    pageSize: 20,
  },
}

export const useUiStore = defineStore('ui', () => {
  // State
  const preferences = ref<UiPreferences>({ ...DEFAULT_PREFERENCES })
  const notifications = ref<Array<{
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message: string
    timestamp: Date
    duration?: number
    read: boolean
  }>>([])

  const isLoading = ref(false)
  const globalError = ref<string | null>(null)

  // Storage key
  const STORAGE_KEY = 'ui-preferences'

  // Getters
  const currentTheme = computed(() => {
    if (preferences.value.theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return preferences.value.theme
  })

  const unreadNotifications = computed(() => 
    notifications.value.filter(n => !n.read)
  )

  const notificationsByType = computed(() => {
    const grouped: Record<string, typeof notifications.value> = {
      info: [],
      success: [],
      warning: [],
      error: [],
    }

    notifications.value.forEach((notification) => {
      if (grouped[notification.type]) {
        grouped[notification.type].push(notification)
      }
    })

    return grouped
  })

  const isSidebarCollapsed = computed(() => preferences.value.layout.sidebarCollapsed)

  const pageSize = computed(() => preferences.value.layout.pageSize)

  const notificationsEnabled = computed(() => preferences.value.notifications.enabled)

  const taskNotificationsEnabled = computed(() => 
    notificationsEnabled.value && preferences.value.notifications.taskUpdates
  )

  const scrapeNotificationsEnabled = computed(() => 
    notificationsEnabled.value && preferences.value.notifications.scrapeUpdates
  )

  const errorNotificationsEnabled = computed(() => 
    notificationsEnabled.value && preferences.value.notifications.errors
  )

  // Actions
  const loadPreferences = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        preferences.value = { ...DEFAULT_PREFERENCES, ...parsed }
      }
    } catch (error) {
      console.error('Failed to load UI preferences:', error)
      preferences.value = { ...DEFAULT_PREFERENCES }
    }
  }

  const savePreferences = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences.value))
    } catch (error) {
      console.error('Failed to save UI preferences:', error)
    }
  }

  const updatePreferences = (updates: Partial<UiPreferences>) => {
    preferences.value = {
      ...preferences.value,
      ...updates,
      // Deep merge for nested objects
      notifications: {
        ...preferences.value.notifications,
        ...(updates.notifications || {}),
      },
      layout: {
        ...preferences.value.layout,
        ...(updates.layout || {}),
      },
    }
  }

  const setTheme = (theme: UiPreferences['theme']) => {
    updatePreferences({ theme })
    applyTheme(theme)
  }

  const setLanguage = (language: string) => {
    updatePreferences({ language })
  }

  const updateNotificationSettings = (settings: Partial<UiPreferences['notifications']>) => {
    updatePreferences({
      notifications: {
        ...preferences.value.notifications,
        ...settings,
      },
    })
  }

  const updateLayoutSettings = (settings: Partial<UiPreferences['layout']>) => {
    updatePreferences({
      layout: {
        ...preferences.value.layout,
        ...settings,
      },
    })
  }

  const toggleSidebar = () => {
    updateLayoutSettings({
      sidebarCollapsed: !preferences.value.layout.sidebarCollapsed,
    })
  }

  const setSidebarCollapsed = (collapsed: boolean) => {
    updateLayoutSettings({ sidebarCollapsed: collapsed })
  }

  const setPageSize = (size: number) => {
    updateLayoutSettings({ pageSize: size })
  }

  const resetPreferences = () => {
    preferences.value = { ...DEFAULT_PREFERENCES }
  }

  // Notification actions
  const addNotification = (
    type: 'info' | 'success' | 'warning' | 'error',
    title: string,
    message: string,
    duration?: number
  ) => {
    const notification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      title,
      message,
      timestamp: new Date(),
      duration: duration ?? (type === 'error' ? 0 : 5000), // Errors don't auto-dismiss
      read: false,
    }

    notifications.value.unshift(notification)

    // Auto-dismiss if duration is set
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(notification.id)
      }, notification.duration)
    }

    return notification.id
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  const markNotificationAsRead = (id: string) => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  const markAllNotificationsAsRead = () => {
    notifications.value.forEach(n => {
      n.read = true
    })
  }

  const clearNotifications = () => {
    notifications.value = []
  }

  const clearReadNotifications = () => {
    notifications.value = notifications.value.filter(n => !n.read)
  }

  // Global loading and error actions
  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setGlobalError = (error: string | null) => {
    globalError.value = error
    if (error && errorNotificationsEnabled.value) {
      addNotification('error', 'Error', error)
    }
  }

  const clearGlobalError = () => {
    globalError.value = null
  }

  // Theme application
  const applyTheme = (theme: UiPreferences['theme']) => {
    const actualTheme = theme === 'auto' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme

    document.documentElement.setAttribute('data-theme', actualTheme)
  }

  // Watch for system theme changes when using 'auto' theme
  const setupThemeWatcher = () => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      if (preferences.value.theme === 'auto') {
        applyTheme('auto')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }

  // Initialize
  const initialize = () => {
    loadPreferences()
    applyTheme(preferences.value.theme)
    const cleanup = setupThemeWatcher()
    return cleanup
  }

  // Auto-save preferences when they change
  watch(preferences, savePreferences, { deep: true })

  // Convenience methods for common notifications
  const showSuccess = (title: string, message: string, duration?: number) => {
    return addNotification('success', title, message, duration)
  }

  const showError = (title: string, message: string, duration?: number) => {
    return addNotification('error', title, message, duration)
  }

  const showWarning = (title: string, message: string, duration?: number) => {
    return addNotification('warning', title, message, duration)
  }

  const showInfo = (title: string, message: string, duration?: number) => {
    return addNotification('info', title, message, duration)
  }

  return {
    // State
    preferences: readonly(preferences),
    notifications: readonly(notifications),
    isLoading: readonly(isLoading),
    globalError: readonly(globalError),
    
    // Getters
    currentTheme,
    unreadNotifications,
    notificationsByType,
    isSidebarCollapsed,
    pageSize,
    notificationsEnabled,
    taskNotificationsEnabled,
    scrapeNotificationsEnabled,
    errorNotificationsEnabled,
    
    // Actions
    initialize,
    loadPreferences,
    savePreferences,
    updatePreferences,
    setTheme,
    setLanguage,
    updateNotificationSettings,
    updateLayoutSettings,
    toggleSidebar,
    setSidebarCollapsed,
    setPageSize,
    resetPreferences,
    
    // Notification actions
    addNotification,
    removeNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    clearReadNotifications,
    
    // Global state actions
    setLoading,
    setGlobalError,
    clearGlobalError,
    
    // Convenience methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
})