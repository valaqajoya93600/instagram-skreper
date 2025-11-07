<template>
  <div class="task-item" :class="[`status-${task.status}`, { 'has-error': task.error }]">
    <div class="task-header">
      <div class="task-info">
        <h3 class="task-title">{{ task.title || `Task ${task.id}` }}</h3>
        <div class="task-meta">
          <span class="task-id">ID: {{ task.id }}</span>
          <span class="task-time">{{ formatTime(task.createdAt) }}</span>
        </div>
      </div>
      
      <div class="task-status">
        <span :class="['status-badge', `status-${task.status}`]">
          {{ getStatusText(task.status) }}
        </span>
      </div>
    </div>

    <!-- Progress Bar -->
    <div v-if="task.status === 'running'" class="progress-section">
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: `${task.progress || 0}%` }"
        ></div>
      </div>
      <span class="progress-text">{{ task.progress || 0 }}%</span>
    </div>

    <!-- Task Details -->
    <div class="task-details">
      <div class="detail-row">
        <span class="detail-label">Target:</span>
        <span class="detail-value">{{ task.target || 'N/A' }}</span>
      </div>
      
      <div class="detail-row">
        <span class="detail-label">Max Followers:</span>
        <span class="detail-value">{{ task.maxFollowers || 'N/A' }}</span>
      </div>
      
      <div v-if="task.exportFormat" class="detail-row">
        <span class="detail-label">Export Format:</span>
        <span class="detail-value">{{ task.exportFormat }}</span>
      </div>
      
      <div v-if="task.status === 'challenge_required' && task.challenge" class="challenge-info">
        <span class="detail-label">Challenge:</span>
        <span class="detail-value challenge-text">{{ task.challenge }}</span>
      </div>
      
      <div v-if="task.error" class="error-info">
        <span class="detail-label">Error:</span>
        <span class="detail-value error-text">{{ task.error }}</span>
      </div>
    </div>

    <!-- Results Summary -->
    <div v-if="task.status === 'completed' && task.results" class="results-summary">
      <div class="detail-row">
        <span class="detail-label">Results:</span>
        <span class="detail-value">
          {{ task.results.count || 0 }} items scraped
          <span v-if="task.results.fileSize">
            ({{ formatFileSize(task.results.fileSize) }})
          </span>
        </span>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="task-actions">
      <button
        v-if="task.status === 'pending' || task.status === 'running'"
        @click="handleCancel"
        class="action-btn cancel-btn"
        :disabled="task.status === 'cancelling'"
      >
        {{ task.status === 'cancelling' ? 'Cancelling...' : 'Cancel' }}
      </button>
      
      <button
        v-if="task.status === 'completed'"
        @click="handleDownload"
        class="action-btn download-btn"
      >
        Download
      </button>
      
      <button
        @click="handleView"
        class="action-btn view-btn"
      >
        View Details
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TaskItem',
  props: {
    task: {
      type: Object,
      required: true
    }
  },
  emits: ['cancel', 'download', 'view'],
  methods: {
    getStatusText(status) {
      const statusMap = {
        'pending': 'Pending',
        'running': 'Running',
        'completed': 'Completed',
        'failed': 'Failed',
        'cancelled': 'Cancelled',
        'cancelling': 'Cancelling',
        'challenge_required': 'Challenge Required'
      }
      return statusMap[status] || status
    },
    
    formatTime(timestamp) {
      if (!timestamp) return 'N/A'
      
      const date = new Date(timestamp)
      const now = new Date()
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)
      
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      
      return date.toLocaleDateString()
    },
    
    formatFileSize(bytes) {
      if (!bytes) return '0 B'
      
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(1024))
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
    },
    
    handleCancel() {
      this.$emit('cancel', this.task.id)
    },
    
    handleDownload() {
      this.$emit('download', this.task.id)
    },
    
    handleView() {
      this.$emit('view', this.task)
    }
  }
}
</script>

<style scoped>
.task-item {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 1.5rem;
  border-left: 4px solid #95a5a6;
  transition: all 0.2s ease;
}

.task-item:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  transform: translateY(-1px);
}

.task-item.status-pending {
  border-left-color: #95a5a6;
}

.task-item.status-running {
  border-left-color: #3498db;
}

.task-item.status-completed {
  border-left-color: #27ae60;
}

.task-item.status-failed,
.task-item.has-error {
  border-left-color: #e74c3c;
}

.task-item.status-cancelled {
  border-left-color: #95a5a6;
}

.task-item.status-challenge_required {
  border-left-color: #f39c12;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.task-info {
  flex: 1;
}

.task-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.task-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #7f8c8d;
}

.task-id {
  font-family: monospace;
  background: #f8f9fa;
  padding: 0.125rem 0.25rem;
  border-radius: 3px;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-pending {
  background: #ecf0f1;
  color: #7f8c8d;
}

.status-running {
  background: #e3f2fd;
  color: #1976d2;
}

.status-completed {
  background: #e8f5e8;
  color: #2e7d32;
}

.status-failed {
  background: #ffebee;
  color: #c62828;
}

.status-cancelled {
  background: #f5f5f5;
  color: #757575;
}

.status-cancelling {
  background: #fff3e0;
  color: #ef6c00;
}

.status-challenge_required {
  background: #fff8e1;
  color: #f57c00;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2980b9);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #3498db;
  min-width: 40px;
}

.task-details {
  margin-bottom: 1rem;
}

.detail-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.detail-label {
  font-weight: 600;
  color: #555;
  min-width: 100px;
}

.detail-value {
  color: #333;
  flex: 1;
}

.challenge-text {
  color: #f39c12;
  font-weight: 500;
}

.error-text {
  color: #e74c3c;
  font-weight: 500;
}

.results-summary {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #e8f5e8;
  border-radius: 4px;
  border-left: 3px solid #27ae60;
}

.task-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.cancel-btn {
  background: #e74c3c;
  color: white;
}

.cancel-btn:hover:not(:disabled) {
  background: #c0392b;
}

.download-btn {
  background: #27ae60;
  color: white;
}

.download-btn:hover {
  background: #229954;
}

.view-btn {
  background: #3498db;
  color: white;
}

.view-btn:hover {
  background: #2980b9;
}

@media (max-width: 768px) {
  .task-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .task-meta {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .task-actions {
    justify-content: stretch;
  }
  
  .action-btn {
    flex: 1;
  }
}
</style>