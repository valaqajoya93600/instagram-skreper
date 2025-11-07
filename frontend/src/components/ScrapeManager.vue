<template>
  <div class="scrape-manager">
    <div class="scrape-header">
      <h2>Scrape Manager</h2>
      <button @click="showForm = !showForm" class="btn btn-primary">
        {{ showForm ? 'Hide Form' : 'New Job' }}
      </button>
    </div>

    <!-- Scrape Form -->
    <div v-if="showForm" class="scrape-form">
      <h3>Submit New Scrape Job</h3>
      <form @submit.prevent="submitJob">
        <div class="form-group">
          <label for="url">URL *</label>
          <input
            id="url"
            v-model="scrapeStore.form.url"
            type="url"
            placeholder="https://example.com"
            required
          />
        </div>

        <div class="form-group">
          <label for="method">Method</label>
          <select id="method" v-model="scrapeStore.form.method">
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>
        </div>

        <div v-if="scrapeStore.form.method === 'POST'" class="form-group">
          <label for="body">Body</label>
          <textarea
            id="body"
            v-model="scrapeStore.form.body"
            placeholder="Request body content"
            rows="4"
          />
        </div>

        <div class="form-group">
          <label>CSS Selector (optional)</label>
          <input
            v-model="scrapeStore.form.selector"
            type="text"
            placeholder=".content or #main"
          />
        </div>

        <div class="form-group">
          <label>Wait For (optional)</label>
          <input
            v-model="scrapeStore.form.waitFor"
            type="text"
            selector=".loaded or #ready"
          />
        </div>

        <div class="form-group">
          <label>
            <input
              v-model="scrapeStore.form.screenshot"
              type="checkbox"
            />
            Take Screenshot
          </label>
        </div>

        <div class="form-group">
          <label>
            <input
              v-model="scrapeStore.form.javascript"
              type="checkbox"
            />
            Execute JavaScript
          </label>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            :disabled="!scrapeStore.formIsValid || scrapeStore.isLoading"
            class="btn btn-primary"
          >
            {{ scrapeStore.isLoading ? 'Submitting...' : 'Submit Job' }}
          </button>
          <button
            type="button"
            @click="scrapeStore.resetForm"
            class="btn btn-secondary"
          >
            Reset
          </button>
        </div>
      </form>
    </div>

    <div v-if="scrapeStore.isLoading && scrapeStore.jobs.length === 0" class="loading">
      Loading jobs...
    </div>

    <div v-else-if="scrapeStore.jobs.length === 0" class="empty-state">
      <p>No scrape jobs found. Create your first job!</p>
    </div>

    <div v-else class="job-content">
      <div class="job-stats">
        <div class="stat-card">
          <h3>Active</h3>
          <span class="stat-number">{{ scrapeStore.activeJobs.length }}</span>
        </div>
        <div class="stat-card">
          <h3>Completed</h3>
          <span class="stat-number">{{ scrapeStore.completedJobs.length }}</span>
        </div>
        <div class="stat-card">
          <h3>Failed</h3>
          <span class="stat-number">{{ scrapeStore.failedJobs.length }}</span>
        </div>
      </div>

      <div class="job-list">
        <div 
          v-for="job in scrapeStore.jobs" 
          :key="job.id"
          :class="['job-item', `job-${job.status}`]"
          @click="selectJob(job)"
        >
          <div class="job-info">
            <h4>{{ job.url }}</h4>
            <p class="job-meta">
              Method: {{ job.method }} | 
              Status: {{ job.status }} | 
              Created: {{ formatDate(job.createdAt) }}
            </p>
            <p v-if="job.error" class="job-error">{{ job.error }}</p>
          </div>
          <div class="job-actions">
            <button 
              v-if="job.status === 'pending' || job.status === 'running'"
              @click.stop="cancelJob(job.id)"
              class="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              @click.stop="deleteJob(job.id)"
              class="btn btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Job Detail Modal -->
    <div v-if="selectedJob" class="modal-overlay" @click="closeDetail">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Job Details</h3>
          <button @click="closeDetail" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-row">
            <strong>ID:</strong> {{ selectedJob.id }}
          </div>
          <div class="detail-row">
            <strong>URL:</strong> {{ selectedJob.url }}
          </div>
          <div class="detail-row">
            <strong>Method:</strong> {{ selectedJob.method }}
          </div>
          <div class="detail-row">
            <strong>Status:</strong> 
            <span :class="['status-badge', `status-${selectedJob.status}`]">
              {{ selectedJob.status }}
            </span>
          </div>
          <div class="detail-row">
            <strong>Created:</strong> {{ formatDate(selectedJob.createdAt) }}
          </div>
          <div v-if="selectedJob.completedAt" class="detail-row">
            <strong>Completed:</strong> {{ formatDate(selectedJob.completedAt) }}
          </div>
          <div v-if="selectedJob.selector" class="detail-row">
            <strong>Selector:</strong> {{ selectedJob.selector }}
          </div>
          <div v-if="selectedJob.waitFor" class="detail-row">
            <strong>Wait For:</strong> {{ selectedJob.waitFor }}
          </div>
          <div v-if="selectedJob.screenshot" class="detail-row">
            <strong>Screenshot:</strong> Yes
          </div>
          <div v-if="selectedJob.javascript !== undefined" class="detail-row">
            <strong>JavaScript:</strong> {{ selectedJob.javascript ? 'Enabled' : 'Disabled' }}
          </div>
          <div v-if="selectedJob.error" class="detail-row">
            <strong>Error:</strong> 
            <span class="error-text">{{ selectedJob.error }}</span>
          </div>
          <div v-if="selectedJob.result" class="detail-row">
            <strong>Result:</strong>
            <div class="result-preview">
              <div v-if="selectedJob.result.html" class="result-section">
                <strong>HTML:</strong>
                <pre class="result-content">{{ selectedJob.result.html.substring(0, 500) }}{{ selectedJob.result.html.length > 500 ? '...' : '' }}</pre>
              </div>
              <div v-if="selectedJob.result.text" class="result-section">
                <strong>Text:</strong>
                <pre class="result-content">{{ selectedJob.result.text.substring(0, 500) }}{{ selectedJob.result.text.length > 500 ? '...' : '' }}</pre>
              </div>
              <div v-if="selectedJob.result.links && selectedJob.result.links.length > 0" class="result-section">
                <strong>Links ({{ selectedJob.result.links.length }}):</strong>
                <ul class="link-list">
                  <li v-for="link in selectedJob.result.links.slice(0, 10)" :key="link">{{ link }}</li>
                  <li v-if="selectedJob.result.links.length > 10">... and {{ selectedJob.result.links.length - 10 }} more</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useScrapeStore } from '@/stores/scrapeStore'
import { useUiStore } from '@/stores/uiStore'
import type { ScrapeJob } from '@/types'

const scrapeStore = useScrapeStore()
const uiStore = useUiStore()
const showForm = ref(false)
const selectedJob = ref<ScrapeJob | null>(null)

onMounted(async () => {
  try {
    await scrapeStore.fetchJobs()
  } catch (error) {
    uiStore.showError('Error', 'Failed to load scrape jobs')
  }
})

const submitJob = async () => {
  try {
    const job = await scrapeStore.submitJob()
    uiStore.showSuccess('Success', `Scrape job for "${job.url}" submitted`)
    showForm.value = false
  } catch (error) {
    uiStore.showError('Error', 'Failed to submit scrape job')
  }
}

const cancelJob = async (id: string) => {
  try {
    const job = await scrapeStore.cancelJob(id)
    uiStore.showInfo('Cancelled', `Scrape job for "${job.url}" was cancelled`)
  } catch (error) {
    uiStore.showError('Error', 'Failed to cancel scrape job')
  }
}

const deleteJob = async (id: string) => {
  if (!confirm('Are you sure you want to delete this job?')) {
    return
  }
  
  try {
    await scrapeStore.deleteJob(id)
    uiStore.showSuccess('Success', 'Scrape job deleted')
  } catch (error) {
    uiStore.showError('Error', 'Failed to delete scrape job')
  }
}

const selectJob = (job: ScrapeJob) => {
  selectedJob.value = job
}

const closeDetail = () => {
  selectedJob.value = null
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleString()
}
</script>

<style scoped>
.scrape-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.scrape-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.scrape-header h2 {
  margin: 0;
  color: var(--color-text);
}

.scrape-form {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.scrape-form h3 {
  margin: 0 0 1rem 0;
  color: var(--color-text);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text);
  font-weight: 500;
}

.form-group input[type="url"],
.form-group input[type="text"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 1rem;
}

.form-group input[type="checkbox"] {
  margin-right: 0.5rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.loading, .empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-secondary);
}

.job-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.job-stats {
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

.job-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.job-item {
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

.job-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.job-item.job-pending {
  border-left: 4px solid var(--color-info);
}

.job-item.job-running {
  border-left: 4px solid var(--color-warning);
}

.job-item.job-completed {
  border-left: 4px solid var(--color-success);
}

.job-item.job-failed {
  border-left: 4px solid var(--color-error);
}

.job-info {
  flex: 1;
}

.job-info h4 {
  margin: 0 0 0.5rem 0;
  color: var(--color-text);
  word-break: break-all;
}

.job-meta {
  margin: 0 0 0.5rem 0;
  color: var(--color-secondary);
  font-size: 0.9rem;
}

.job-error {
  margin: 0;
  color: var(--color-error);
  font-size: 0.9rem;
}

.job-actions {
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
  max-width: 800px;
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

.result-preview {
  background-color: var(--color-border);
  padding: 1rem;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.result-section {
  margin-bottom: 1rem;
}

.result-section:last-child {
  margin-bottom: 0;
}

.result-content {
  background-color: var(--color-background);
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  overflow-x: auto;
  margin: 0.5rem 0 0 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.link-list {
  margin: 0.5rem 0 0 0;
  padding-left: 1.5rem;
}

.link-list li {
  font-size: 0.9rem;
  word-break: break-all;
  margin-bottom: 0.25rem;
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
  .scrape-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .job-item {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .job-actions {
    justify-content: flex-end;
  }
  
  .modal {
    margin: 0.5rem;
    padding: 1rem;
  }
}
</style>