<template>
  <div id="app" :data-theme="uiStore.currentTheme">
    <header class="app-header">
      <h1>Railway Deploy Automation</h1>
      <nav class="app-nav">
        <button @click="uiStore.toggleSidebar" class="nav-btn">
          {{ uiStore.isSidebarCollapsed ? '☰' : '✕' }}
        </button>
        <button @click="uiStore.setTheme(uiStore.currentTheme === 'light' ? 'dark' : 'light')" class="nav-btn">
          {{ uiStore.currentTheme === 'light' ? '🌙' : '☀️' }}
        </button>
      </nav>
    </header>

    <main class="app-main">
      <aside v-if="!uiStore.isSidebarCollapsed" class="sidebar">
        <div class="sidebar-section">
          <h3>Tasks</h3>
          <div class="stats">
            <span>Active: {{ taskStore.activeTasks.length }}</span>
            <span>Completed: {{ taskStore.completedTasks.length }}</span>
            <span>Failed: {{ taskStore.failedTasks.length }}</span>
          </div>
        </div>
        
        <div class="sidebar-section">
          <h3>Scrape Jobs</h3>
          <div class="stats">
            <span>Active: {{ scrapeStore.activeJobs.length }}</span>
            <span>Completed: {{ scrapeStore.completedJobs.length }}</span>
            <span>Failed: {{ scrapeStore.failedJobs.length }}</span>
          </div>
        </div>

        <div class="sidebar-section">
          <h3>Notifications</h3>
          <div class="notification-indicator">
            <span :class="{ 'has-unread': uiStore.unreadNotifications.length > 0 }">
              {{ uiStore.unreadNotifications.length }} unread
            </span>
          </div>
        </div>
      </aside>

      <div class="content">
        <nav class="content-nav">
          <router-link to="/" class="nav-link">Home</router-link>
          <router-link to="/tasks" class="nav-link">Tasks</router-link>
          <router-link to="/scrape" class="nav-link">Scrape</router-link>
        </nav>
        <router-view />
      </div>
    </main>

    <!-- Notification Container -->
    <div class="notification-container">
      <div
        v-for="notification in uiStore.notifications.slice(0, 5)"
        :key="notification.id"
        :class="['notification', `notification-${notification.type}`, { 'notification-read': notification.read }]"
        @click="uiStore.markNotificationAsRead(notification.id)"
      >
        <div class="notification-header">
          <strong>{{ notification.title }}</strong>
          <button @click.stop="uiStore.removeNotification(notification.id)" class="close-btn">×</button>
        </div>
        <div class="notification-message">{{ notification.message }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { useScrapeStore } from '@/stores/scrapeStore'
import { useUiStore } from '@/stores/uiStore'

const taskStore = useTaskStore()
const scrapeStore = useScrapeStore()
const uiStore = useUiStore()

let cleanupTaskStore: (() => void) | null = null
let cleanupScrapeStore: (() => void) | null = null

onMounted(async () => {
  // Initialize UI store
  const cleanupUiStore = uiStore.initialize()
  
  // Initialize task store
  try {
    await taskStore.initialize()
    await taskStore.fetchTasks()
    cleanupTaskStore = taskStore.cleanup
  } catch (error) {
    console.error('Failed to initialize task store:', error)
    uiStore.showError('Error', 'Failed to initialize tasks')
  }
  
  // Initialize scrape store
  try {
    await scrapeStore.initialize()
    await scrapeStore.fetchJobs()
    cleanupScrapeStore = scrapeStore.cleanup
  } catch (error) {
    console.error('Failed to initialize scrape store:', error)
    uiStore.showError('Error', 'Failed to initialize scrape jobs')
  }
  
  // Cleanup function for UI store
  onUnmounted(() => {
    cleanupUiStore?.()
    cleanupTaskStore?.()
    cleanupScrapeStore?.()
  })
})
</script>

<style scoped>
#app {
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: var(--color-text);
  background-color: var(--color-background);
  --color-background: #ffffff;
  --color-text: #333333;
  --color-primary: #0066cc;
  --color-secondary: #666666;
  --color-border: #e0e0e0;
  --color-success: #28a745;
  --color-warning: #ffc107;
  --color-error: #dc3545;
  --color-info: #17a2b8;
}

#app[data-theme="dark"] {
  --color-background: #1a1a1a;
  --color-text: #ffffff;
  --color-primary: #4da6ff;
  --color-secondary: #cccccc;
  --color-border: #333333;
  --color-success: #34ce57;
  --color-warning: #ffcd39;
  --color-error: #ff4757;
  --color-info: #48dbfb;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: var(--color-primary);
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.app-nav {
  display: flex;
  gap: 1rem;
}

.nav-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.nav-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.app-main {
  display: flex;
  min-height: calc(100vh - 80px);
}

.sidebar {
  width: 300px;
  background-color: var(--color-background);
  border-right: 1px solid var(--color-border);
  padding: 1rem;
  overflow-y: auto;
}

.sidebar-section {
  margin-bottom: 2rem;
}

.sidebar-section h3 {
  margin: 0 0 1rem 0;
  color: var(--color-text);
  font-size: 1.1rem;
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stats span {
  color: var(--color-secondary);
  font-size: 0.9rem;
}

.notification-indicator .has-unread {
  color: var(--color-primary);
  font-weight: bold;
}

.content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.content-nav {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.nav-link {
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: var(--color-secondary);
  border-radius: 4px;
  transition: all 0.2s;
}

.nav-link:hover {
  background-color: var(--color-border);
  color: var(--color-text);
}

.nav-link.router-link-active {
  background-color: var(--color-primary);
  color: white;
}

.notification-container {
  position: fixed;
  top: 100px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
}

.notification {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.2s;
}

.notification:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.notification-read {
  opacity: 0.7;
}

.notification-success {
  border-left: 4px solid var(--color-success);
}

.notification-error {
  border-left: 4px solid var(--color-error);
}

.notification-warning {
  border-left: 4px solid var(--color-warning);
}

.notification-info {
  border-left: 4px solid var(--color-info);
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--color-secondary);
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--color-text);
}

.notification-message {
  color: var(--color-secondary);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .app-header {
    padding: 1rem;
  }
  
  .sidebar {
    position: fixed;
    left: 0;
    top: 80px;
    height: calc(100vh - 80px);
    z-index: 100;
    transform: translateX(-100%);
    transition: transform 0.3s;
  }
  
  .sidebar:not(.collapsed) {
    transform: translateX(0);
  }
  
  .content {
    padding: 1rem;
  }
  
  .notification-container {
    left: 10px;
    right: 10px;
    max-width: none;
  }
}
</style>