<template>
  <div class="task-manager">
    <div class="task-header">
      <h2>Task Manager</h2>
      <button @click="createNewTask" :disabled="uiStore.isLoading" class="btn btn-primary">
        New Task
      </button>
    </div>

    <div v-if="taskStore.isLoading" class="loading">
      Loading tasks...
    </div>

    <div v-else-if="taskStore.tasks.length === 0" class="empty-state">
      <p>No tasks found. Create your first task!</p>
    </div>

    <div v-else class="task-content">
      <div class="task-stats">
        <div class="stat-card">
          <h3>Active</h3>
          <span class="stat-number">{{ taskStore.activeTasks.length }}</span>
        </div>
        <div class="stat-card">
          <h3>Completed</h3>
          <span class="stat-number">{{ taskStore.completedTasks.length }}</span>
        </div>
        <div class="stat-card">
          <h3>Failed</h3>
          <span class="stat-number">{{ taskStore.failedTasks.length }}</span>
        </div>
      </div>

      <div class="task-list">
        <div 
          v-for="task in taskStore.tasks" 
          :key="task.id"
          :class="['task-item', `task-${task.status}`]"
          @click="selectTask(task)"
        >
          <div class="task-info">
            <h4>{{ task.name }}</h4>
            <p class="task-meta">
              Type: {{ task.type }} | 
              Status: {{ task.status }} | 
              Created: {{ formatDate(task.createdAt) }}
            </p>
            <p v-if="task.error" class="task-error">{{ task.error }}</p>
          </div>
          <div class="task-actions">
            <button 
              v-if="task.status === 'pending' || task.status === 'running'"
              @click.stop="cancelTask(task.id)"
              class="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              @click.stop="deleteTask(task.id)"
              class="btn btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Detail Modal -->
    <div v-if="selectedTask" class="modal-overlay" @click="closeDetail">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Task Details</h3>
          <button @click="closeDetail" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-row">
            <strong>ID:</strong> {{ selectedTask.id }}
          </div>
          <div class="detail-row">
            <strong>Name:</strong> {{ selectedTask.name }}
          </div>
          <div class="detail-row">
            <strong>Type:</strong> {{ selectedTask.type }}
          </div>
          <div class="detail-row">
            <strong>Status:</strong> 
            <span :class="['status-badge', `status-${selectedTask.status}`]">
              {{ selectedTask.status }}
            </span>
          </div>
          <div class="detail-row">
            <strong>Created:</strong> {{ formatDate(selectedTask.createdAt) }}
          </div>
          <div v-if="selectedTask.startedAt" class="detail-row">
            <strong>Started:</strong> {{ formatDate(selectedTask.startedAt) }}
          </div>
          <div v-if="selectedTask.completedAt" class="detail-row">
            <strong>Completed:</strong> {{ formatDate(selectedTask.completedAt) }}
          </div>
          <div v-if="selectedTask.error" class="detail-row">
            <strong>Error:</strong> 
            <span class="error-text">{{ selectedTask.error }}</span>
          </div>
          <div v-if="selectedTask.metadata" class="detail-row">
            <strong>Metadata:</strong>
            <pre>{{ JSON.stringify(selectedTask.metadata, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { useUiStore } from '@/stores/uiStore'
import type { Task } from '@/types'

const taskStore = useTaskStore()
const uiStore = useUiStore()
const selectedTask = ref<Task | null>(null)

onMounted(async () => {
  try {
    await taskStore.fetchTasks()
  } catch (error) {
    uiStore.showError('Error', 'Failed to load tasks')
  }
})

const createNewTask = async () => {
  try {
    const task = await taskStore.createTask({
      name: `Task ${Date.now()}`,
      type: 'deployment',
      metadata: {
        environment: 'staging',
        service: 'web',
      },
    })
    uiStore.showSuccess('Success', `Task "${task.name}" created`)
  } catch (error) {
    uiStore.showError('Error', 'Failed to create task')
  }
}

const cancelTask = async (id: string) => {
  try {
    const task = await taskStore.cancelTask(id)
    uiStore.showInfo('Cancelled', `Task "${task.name}" was cancelled`)
  } catch (error) {
    uiStore.showError('Error', 'Failed to cancel task')
  }
}

const deleteTask = async (id: string) => {
  if (!confirm('Are you sure you want to delete this task?')) {
    return
  }
  
  try {
    await taskStore.deleteTask(id)
    uiStore.showSuccess('Success', 'Task deleted')
  } catch (error) {
    uiStore.showError('Error', 'Failed to delete task')
  }
}

const selectTask = (task: Task) => {
  selectedTask.value = task
}

const closeDetail = () => {
  selectedTask.value = null
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleString()
}
</script>

<style scoped>
.task-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.task-header h2 {
  margin: 0;
  color: var(--color-text);
}

.loading, .empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-secondary);
}

.task-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.task-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-card {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.stat-card h3 {
  margin: 0 0 0.5rem 0;
  color: var(--color-secondary);
  font-size: 0.9rem;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-primary);
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-item {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.task-item.task-pending {
  border-left: 4px solid var(--color-info);
}

.task-item.task-running {
  border-left: 4px solid var(--color-warning);
}

.task-item.task-completed {
  border-left: 4px solid var(--color-success);
}

.task-item.task-failed {
  border-left: 4px solid var(--color-error);
}

.task-info {
  flex: 1;
}

.task-info h4 {
  margin: 0 0 0.5rem 0;
  color: var(--color-text);
}

.task-meta {
  margin: 0 0 0.5rem 0;
  color: var(--color-secondary);
  font-size: 0.9rem;
}

.task-error {
  margin: 0;
  color: var(--color-error);
  font-size: 0.9rem;
}

.task-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-secondary {
  background-color: var(--color-secondary);
  color: white;
}

.btn-secondary:hover {
  opacity: 0.9;
}

.btn-danger {
  background-color: var(--color-error);
  color: white;
}

.btn-danger:hover {
  opacity: 0.9;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background-color: var(--color-background);
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  margin: 1rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-header h3 {
  margin: 0;
  color: var(--color-text);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-secondary);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--color-text);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-row strong {
  color: var(--color-text);
}

.detail-row pre {
  background-color: var(--color-border);
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  overflow-x: auto;
  margin: 0;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
}

.status-pending {
  background-color: var(--color-info);
  color: white;
}

.status-running {
  background-color: var(--color-warning);
  color: white;
}

.status-completed {
  background-color: var(--color-success);
  color: white;
}

.status-failed {
  background-color: var(--color-error);
  color: white;
}

.error-text {
  color: var(--color-error);
}

@media (max-width: 768px) {
  .task-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .task-item {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .task-actions {
    justify-content: flex-end;
  }
  
  .modal {
    margin: 0.5rem;
    padding: 1rem;
  }
}
</style>