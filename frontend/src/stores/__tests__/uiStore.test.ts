import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUiStore } from '../uiStore'
import type { UiPreferences } from '@/types'

describe('UiStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    
    // Reset localStorage mock
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    })
    
    // Reset matchMedia mock
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
    
    // Reset document.documentElement mock
    if (!document.documentElement) {
      Object.defineProperty(document, 'documentElement', {
        value: {
          setAttribute: vi.fn(),
        },
        writable: true,
      })
    } else {
      document.documentElement.setAttribute = vi.fn()
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default preferences', () => {
    const store = useUiStore()
    
    expect(store.preferences.theme).toBe('auto')
    expect(store.preferences.language).toBe('en')
    expect(store.preferences.notifications.enabled).toBe(true)
    expect(store.preferences.notifications.taskUpdates).toBe(true)
    expect(store.preferences.notifications.scrapeUpdates).toBe(true)
    expect(store.preferences.notifications.errors).toBe(true)
    expect(store.preferences.layout.sidebarCollapsed).toBe(false)
    expect(store.preferences.layout.pageSize).toBe(20)
  })

  it('should load preferences from localStorage', () => {
    const storedPreferences: UiPreferences = {
      theme: 'dark',
      language: 'fr',
      notifications: {
        enabled: false,
        taskUpdates: false,
        scrapeUpdates: true,
        errors: true,
      },
      layout: {
        sidebarCollapsed: true,
        pageSize: 50,
      },
    }

    const localStorageMock = window.localStorage as any
    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedPreferences))
    
    const store = useUiStore()
    store.loadPreferences()
    
    expect(store.preferences).toEqual(storedPreferences)
    expect(localStorageMock.getItem).toHaveBeenCalledWith('ui-preferences')
  })

  it('should handle corrupted localStorage data', () => {
    const localStorageMock = window.localStorage as any
    localStorageMock.getItem.mockReturnValue('invalid json')
    
    const store = useUiStore()
    store.loadPreferences()
    
    // Should fall back to defaults
    expect(store.preferences.theme).toBe('auto')
    expect(store.preferences.language).toBe('en')
  })

  it('should save preferences to localStorage when changed', () => {
    const store = useUiStore()
    const localStorageMock = window.localStorage as any
    
    store.setTheme('dark')
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'ui-preferences',
      expect.stringContaining('"theme":"dark"')
    )
  })

  it('should handle theme changes correctly', () => {
    const store = useUiStore()
    
    // Test explicit theme
    store.setTheme('dark')
    expect(store.preferences.theme).toBe('dark')
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
    
    store.setTheme('light')
    expect(store.preferences.theme).toBe('light')
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light')
    
    // Test auto theme (light mode preference)
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    
    store.setTheme('auto')
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light')
    
    // Test auto theme (dark mode preference)
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    
    store.setTheme('auto')
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
  })

  it('should handle notification settings correctly', () => {
    const store = useUiStore()
    
    store.updateNotificationSettings({
      enabled: false,
      taskUpdates: false,
    })
    
    expect(store.preferences.notifications.enabled).toBe(false)
    expect(store.preferences.notifications.taskUpdates).toBe(false)
    expect(store.preferences.notifications.scrapeUpdates).toBe(true) // Should remain unchanged
    expect(store.preferences.notifications.errors).toBe(true) // Should remain unchanged
  })

  it('should handle layout settings correctly', () => {
    const store = useUiStore()
    
    store.updateLayoutSettings({
      sidebarCollapsed: true,
      pageSize: 50,
    })
    
    expect(store.preferences.layout.sidebarCollapsed).toBe(true)
    expect(store.preferences.layout.pageSize).toBe(50)
  })

  it('should toggle sidebar correctly', () => {
    const store = useUiStore()
    
    expect(store.preferences.layout.sidebarCollapsed).toBe(false)
    
    store.toggleSidebar()
    expect(store.preferences.layout.sidebarCollapsed).toBe(true)
    
    store.toggleSidebar()
    expect(store.preferences.layout.sidebarCollapsed).toBe(false)
  })

  it('should handle notifications correctly', () => {
    const store = useUiStore()
    
    const id = store.addNotification('success', 'Test', 'Test message', 1000)
    expect(id).toBeDefined()
    expect(store.notifications).toHaveLength(1)
    expect(store.notifications[0].type).toBe('success')
    expect(store.notifications[0].title).toBe('Test')
    expect(store.notifications[0].message).toBe('Test message')
    expect(store.notifications[0].read).toBe(false)
    
    store.markNotificationAsRead(id)
    expect(store.notifications[0].read).toBe(true)
    
    store.removeNotification(id)
    expect(store.notifications).toHaveLength(0)
  })

  it('should auto-dismiss notifications with duration', () => {
    vi.useFakeTimers()
    
    const store = useUiStore()
    
    // const id = store.addNotification('info', 'Test', 'Test message', 5000) // Not used in test
    expect(store.notifications).toHaveLength(1)
    
    // Fast-forward time
    vi.advanceTimersByTime(5000)
    
    expect(store.notifications).toHaveLength(0)
    
    vi.useRealTimers()
  })

  it('should not auto-dismiss error notifications', () => {
    vi.useFakeTimers()
    
    const store = useUiStore()
    
    // const id = store.addNotification('error', 'Error', 'Error message') // Not used in test
    expect(store.notifications).toHaveLength(1)
    expect(store.notifications[0].duration).toBe(0)
    
    // Fast-forward time
    vi.advanceTimersByTime(10000)
    
    expect(store.notifications).toHaveLength(1) // Should still be there
    
    vi.useRealTimers()
  })

  it('should group notifications by type correctly', () => {
    const store = useUiStore()
    
    store.addNotification('info', 'Info 1', 'Info message 1')
    store.addNotification('success', 'Success 1', 'Success message 1')
    store.addNotification('warning', 'Warning 1', 'Warning message 1')
    store.addNotification('error', 'Error 1', 'Error message 1')
    store.addNotification('info', 'Info 2', 'Info message 2')
    
    const grouped = store.notificationsByType
    
    expect(grouped.info).toHaveLength(2)
    expect(grouped.success).toHaveLength(1)
    expect(grouped.warning).toHaveLength(1)
    expect(grouped.error).toHaveLength(1)
  })

  it('should identify unread notifications correctly', () => {
    const store = useUiStore()
    
    const id1 = store.addNotification('info', 'Info 1', 'Info message 1')
    const id2 = store.addNotification('info', 'Info 2', 'Info message 2')
    
    expect(store.unreadNotifications).toHaveLength(2)
    
    store.markNotificationAsRead(id1)
    expect(store.unreadNotifications).toHaveLength(1)
    expect(store.unreadNotifications[0].id).toBe(id2)
    
    store.markAllNotificationsAsRead()
    expect(store.unreadNotifications).toHaveLength(0)
  })

  it('should clear notifications correctly', () => {
    const store = useUiStore()
    
    const id1 = store.addNotification('info', 'Info 1', 'Info message 1')
    const id2 = store.addNotification('info', 'Info 2', 'Info message 2')
    
    store.markNotificationAsRead(id1)
    
    store.clearReadNotifications()
    expect(store.notifications).toHaveLength(1)
    expect(store.notifications[0].id).toBe(id2)
    
    store.clearNotifications()
    expect(store.notifications).toHaveLength(0)
  })

  it('should handle global loading and error states', () => {
    const store = useUiStore()
    
    store.setLoading(true)
    expect(store.isLoading).toBe(true)
    
    store.setLoading(false)
    expect(store.isLoading).toBe(false)
    
    store.setGlobalError('Test error')
    expect(store.globalError).toBe('Test error')
    expect(store.notifications).toHaveLength(1) // Error notification should be added
    
    store.clearGlobalError()
    expect(store.globalError).toBe(null)
  })

  it('should provide convenience notification methods', () => {
    const store = useUiStore()
    
    const successId = store.showSuccess('Success', 'Success message')
    const errorId = store.showError('Error', 'Error message')
    const warningId = store.showWarning('Warning', 'Warning message')
    const infoId = store.showInfo('Info', 'Info message')
    
    expect(store.notifications).toHaveLength(4)
    
    const successNotif = store.notifications.find(n => n.id === successId)
    const errorNotif = store.notifications.find(n => n.id === errorId)
    const warningNotif = store.notifications.find(n => n.id === warningId)
    const infoNotif = store.notifications.find(n => n.id === infoId)
    
    expect(successNotif?.type).toBe('success')
    expect(errorNotif?.type).toBe('error')
    expect(warningNotif?.type).toBe('warning')
    expect(infoNotif?.type).toBe('info')
  })

  it('should reset preferences to defaults', () => {
    const store = useUiStore()
    
    store.setTheme('dark')
    store.setLanguage('fr')
    store.updateNotificationSettings({ enabled: false })
    store.updateLayoutSettings({ sidebarCollapsed: true })
    
    store.resetPreferences()
    
    expect(store.preferences.theme).toBe('auto')
    expect(store.preferences.language).toBe('en')
    expect(store.preferences.notifications.enabled).toBe(true)
    expect(store.preferences.layout.sidebarCollapsed).toBe(false)
  })

  it('should calculate notification enabled states correctly', () => {
    const store = useUiStore()
    
    // All enabled by default
    expect(store.notificationsEnabled).toBe(true)
    expect(store.taskNotificationsEnabled).toBe(true)
    expect(store.scrapeNotificationsEnabled).toBe(true)
    expect(store.errorNotificationsEnabled).toBe(true)
    
    // Disable all notifications
    store.updateNotificationSettings({ enabled: false })
    expect(store.notificationsEnabled).toBe(false)
    expect(store.taskNotificationsEnabled).toBe(false)
    expect(store.scrapeNotificationsEnabled).toBe(false)
    expect(store.errorNotificationsEnabled).toBe(false)
    
    // Enable all but task updates
    store.updateNotificationSettings({ enabled: true, taskUpdates: false })
    expect(store.notificationsEnabled).toBe(true)
    expect(store.taskNotificationsEnabled).toBe(false)
    expect(store.scrapeNotificationsEnabled).toBe(true)
    expect(store.errorNotificationsEnabled).toBe(true)
  })
})