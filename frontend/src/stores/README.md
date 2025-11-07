# Pinia Stores Documentation

This directory contains the Pinia stores for centralizing state management in the Railway Deploy Automation application.

## Store Overview

### 1. Task Store (`useTaskStore`)

Manages the lifecycle of deployment, migration, and custom tasks.

#### State
- `tasks`: Array of all tasks
- `currentTask`: Currently selected task
- `pagination`: Pagination information for task lists

#### Getters
- `tasksByStatus`: Groups tasks by status (pending, running, completed, failed, cancelled)
- `activeTasks`: Filter for tasks that are pending or running
- `completedTasks`: Filter for completed tasks
- `failedTasks`: Filter for failed tasks
- `tasksByType`: Groups tasks by type (deployment, migration, scrape, custom)
- `getTaskById`: Function to find a task by ID
- `isLoading`: Global loading state

#### Actions
- `fetchTasks(page, pageSize)`: Fetch paginated tasks
- `fetchTask(id)`: Fetch a single task
- `createTask(taskData)`: Create a new task
- `updateTask(id, updates)`: Update an existing task
- `cancelTask(id)`: Cancel a running task
- `deleteTask(id)`: Delete a task
- `refreshTasks()`: Refresh current task list
- `initialize()`: Set up WebSocket listeners
- `cleanup()`: Clean up WebSocket listeners

#### Usage Example

```typescript
import { useTaskStore } from '@/stores'

const taskStore = useTaskStore()

// Initialize store (sets up WebSocket listeners)
await taskStore.initialize()

// Fetch tasks
await taskStore.fetchTasks(1, 20)

// Create a new task
const newTask = await taskStore.createTask({
  name: 'Deploy to production',
  type: 'deployment',
  metadata: { environment: 'production' }
})

// Listen for WebSocket updates (handled automatically)
const activeTasks = taskStore.activeTasks
```

### 2. Scrape Store (`useScrapeStore`)

Manages web scraping jobs and form state for submitting new jobs.

#### State
- `jobs`: Array of all scrape jobs
- `currentJob`: Currently selected job
- `pagination`: Pagination information for job lists
- `form`: Form state for submitting new jobs

#### Getters
- `jobsByStatus`: Groups jobs by status (pending, running, completed, failed)
- `activeJobs`: Filter for jobs that are pending or running
- `completedJobs`: Filter for completed jobs
- `failedJobs`: Filter for failed jobs
- `getJobById`: Function to find a job by ID
- `isLoading`: Global loading state
- `formIsValid`: Validates the submission form

#### Actions
- `fetchJobs(page, pageSize)`: Fetch paginated jobs
- `fetchJob(id)`: Fetch a single job
- `submitJob(jobData?)`: Submit a new scrape job (uses form data if not provided)
- `cancelJob(id)`: Cancel a running job
- `deleteJob(id)`: Delete a job
- `refreshJobs()`: Refresh current job list
- `updateForm(updates)`: Update form state
- `setFormHeader(key, value)`: Set or remove form header
- `removeFormHeader(key)`: Remove a form header
- `resetForm()`: Reset form to default values
- `loadJobIntoForm(job)`: Load existing job data into form
- `initialize()`: Set up WebSocket listeners
- `cleanup()`: Clean up WebSocket listeners

#### Usage Example

```typescript
import { useScrapeStore } from '@/stores'

const scrapeStore = useScrapeStore()

// Initialize store
await scrapeStore.initialize()

// Update form
scrapeStore.updateForm({
  url: 'https://example.com',
  method: 'POST',
  screenshot: true
})

// Set headers
scrapeStore.setFormHeader('Authorization', 'Bearer token')

// Submit job
const job = await scrapeStore.submitJob()

// Or submit with custom data
const customJob = await scrapeStore.submitJob({
  url: 'https://api.example.com',
  method: 'GET',
  selector: '.data'
})
```

### 3. UI Store (`useUiStore`)

Manages UI preferences, theme, notifications, and global application state.

#### State
- `preferences`: User preferences (theme, language, notifications, layout)
- `notifications`: Array of system notifications
- `isLoading`: Global loading state
- `globalError`: Global error message

#### Getters
- `currentTheme`: Currently active theme (respects 'auto' setting)
- `unreadNotifications`: Filter for unread notifications
- `notificationsByType`: Groups notifications by type
- `isSidebarCollapsed`: Sidebar collapsed state
- `pageSize`: Current page size preference
- `notificationsEnabled`: Master notification setting
- `taskNotificationsEnabled`: Task update notifications setting
- `scrapeNotificationsEnabled`: Scrape update notifications setting
- `errorNotificationsEnabled`: Error notifications setting

#### Actions
- `initialize()`: Load preferences and set up theme watcher
- `loadPreferences()`: Load preferences from localStorage
- `savePreferences()`: Save preferences to localStorage
- `updatePreferences(updates)`: Update preferences with deep merge
- `setTheme(theme)`: Change theme and apply to DOM
- `setLanguage(language)`: Change language preference
- `updateNotificationSettings(settings)`: Update notification preferences
- `updateLayoutSettings(settings)`: Update layout preferences
- `toggleSidebar()`: Toggle sidebar collapsed state
- `setSidebarCollapsed(collapsed)`: Set sidebar collapsed state
- `setPageSize(size)`: Set default page size
- `resetPreferences()`: Reset to default preferences

#### Notification Actions
- `addNotification(type, title, message, duration?)`: Add a notification
- `removeNotification(id)`: Remove a notification
- `markNotificationAsRead(id)`: Mark notification as read
- `markAllNotificationsAsRead()`: Mark all as read
- `clearNotifications()`: Clear all notifications
- `clearReadNotifications()`: Clear only read notifications

#### Convenience Methods
- `showSuccess(title, message, duration?)`: Add success notification
- `showError(title, message, duration?)`: Add error notification
- `showWarning(title, message, duration?)`: Add warning notification
- `showInfo(title, message, duration?)`: Add info notification

#### Global State Actions
- `setLoading(loading)`: Set global loading state
- `setGlobalError(error)`: Set global error (also adds notification)
- `clearGlobalError()`: Clear global error

#### Usage Example

```typescript
import { useUiStore } from '@/stores'

const uiStore = useUiStore()

// Initialize store (loads preferences, applies theme)
const cleanup = uiStore.initialize()

// Change theme
uiStore.setTheme('dark')

// Update notification settings
uiStore.updateNotificationSettings({
  taskUpdates: true,
  scrapeUpdates: false
})

// Show notifications
uiStore.showSuccess('Task Complete', 'Deployment was successful')
uiStore.showError('Error', 'Failed to connect to server')

// Toggle sidebar
uiStore.toggleSidebar()

// Cleanup on component unmount
onUnmounted(() => {
  cleanup()
})
```

## Integration with Components

### Store Initialization

Stores should be initialized in your main application component:

```typescript
// In App.vue or main layout
import { useTaskStore, useScrapeStore, useUiStore } from '@/stores'

const taskStore = useTaskStore()
const scrapeStore = useScrapeStore()
const uiStore = useUiStore()

onMounted(async () => {
  const uiCleanup = uiStore.initialize()
  
  try {
    await taskStore.initialize()
    await scrapeStore.initialize()
    
    // Fetch initial data
    await Promise.all([
      taskStore.fetchTasks(),
      scrapeStore.fetchJobs()
    ])
  } catch (error) {
    uiStore.showError('Initialization Error', 'Failed to initialize stores')
  }
  
  onUnmounted(() => {
    uiCleanup()
    taskStore.cleanup()
    scrapeStore.cleanup()
  })
})
```

### Reactive Updates

All stores provide reactive state that automatically updates components:

```vue
<template>
  <div>
    <h2>Tasks ({{ taskStore.activeTasks.length }} active)</h2>
    
    <div v-if="taskStore.isLoading">Loading...</div>
    
    <div v-for="task in taskStore.tasksByStatus.pending" :key="task.id">
      {{ task.name }} - {{ task.status }}
    </div>
  </div>
</template>

<script setup>
import { useTaskStore } from '@/stores'

const taskStore = useTaskStore()
</script>
```

### WebSocket Integration

Task and Scrape stores automatically handle WebSocket events:

```typescript
// WebSocket events are handled automatically
// When a task update is received, the store updates its state
// Components using the store will automatically re-render

// Manual WebSocket handling is also available:
const { onTaskUpdate, onScrapeUpdate } = useWebSocket()

const unsubscribe = onTaskUpdate((task) => {
  console.log('Task updated:', task)
})

// Don't forget to unsubscribe
onUnmounted(() => {
  unsubscribe()
})
```

## Testing

All stores include comprehensive unit tests that verify:

- State initialization and management
- Getter computations
- Action functionality and error handling
- WebSocket event handling
- Form validation and updates
- Preference persistence
- Notification management

Run tests with:
```bash
npm run test:unit
```

## Best Practices

1. **Store Initialization**: Always initialize stores before using them to set up WebSocket listeners
2. **Error Handling**: Use the UI store's notification system for user-facing errors
3. **Cleanup**: Always call cleanup methods when components unmount
4. **Reactivity**: Leverage computed getters for derived state
5. **Type Safety**: All stores are fully typed - use TypeScript for better development experience
6. **Testing**: Write tests for new store functionality following the existing patterns

## File Structure

```
stores/
├── index.ts          # Main export file
├── taskStore.ts      # Task management store
├── scrapeStore.ts    # Scrape job management store
├── uiStore.ts        # UI preferences and notifications store
├── __tests__/        # Unit tests
│   ├── taskStore.test.ts
│   ├── scrapeStore.test.ts
│   └── uiStore.test.ts
└── README.md         # This documentation
```