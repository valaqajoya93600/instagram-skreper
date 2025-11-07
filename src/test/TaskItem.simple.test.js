import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskItem from '../components/TaskItem.vue'

describe('TaskItem - Core Functionality', () => {
  let wrapper

  const mockTask = {
    id: 'test-123',
    title: 'Test Instagram Scrape',
    status: 'running',
    target: 'https://instagram.com/testuser',
    maxFollowers: 1000,
    exportFormat: 'json',
    progress: 65,
    createdAt: '2023-12-01T10:00:00Z'
  }

  beforeEach(() => {
    wrapper = mount(TaskItem, {
      props: { task: mockTask }
    })
  })

  describe('Rendering States', () => {
    it('should render task information correctly', () => {
      expect(wrapper.find('.task-title').text()).toBe('Test Instagram Scrape')
      expect(wrapper.find('.task-id').text()).toContain('test-123')
      expect(wrapper.find('.status-badge').text()).toBe('Running')
    })

    it('should show progress bar for running tasks', () => {
      expect(wrapper.find('.progress-section').exists()).toBe(true)
      expect(wrapper.find('.progress-fill').attributes('style')).toContain('width: 65%')
      expect(wrapper.find('.progress-text').text()).toBe('65%')
    })

    it('should not show progress bar for completed tasks', async () => {
      await wrapper.setProps({ 
        task: { ...mockTask, status: 'completed' } 
      })
      
      expect(wrapper.find('.progress-section').exists()).toBe(false)
    })

    it('should display error information when present', async () => {
      const errorTask = {
        ...mockTask,
        status: 'failed',
        error: 'Instagram API rate limit exceeded'
      }
      
      await wrapper.setProps({ task: errorTask })
      
      expect(wrapper.find('.error-info').exists()).toBe(true)
      expect(wrapper.find('.error-text').text()).toContain('Instagram API rate limit exceeded')
      expect(wrapper.classes()).toContain('has-error')
    })

    it('should display challenge information when required', async () => {
      const challengeTask = {
        ...mockTask,
        state: 'challenge_required',
        challenge: 'Please verify your email address'
      }
      
      await wrapper.setProps({ task: challengeTask })
      
      expect(wrapper.find('.challenge-info').exists()).toBe(true)
      expect(wrapper.find('.challenge-text').text()).toContain('Please verify your email')
    })

    it('should display results summary for completed tasks', async () => {
      const completedTask = {
        ...mockTask,
        status: 'completed',
        results: {
          count: 500,
          fileSize: 2048
        }
      }
      
      await wrapper.setProps({ task: completedTask })
      
      expect(wrapper.find('.results-summary').exists()).toBe(true)
      const resultsText = wrapper.find('.results-summary .detail-value').text()
      expect(resultsText).toContain('500 items scraped')
      expect(resultsText).toContain('2 KB')
    })

    it('should apply correct status classes', () => {
      expect(wrapper.classes()).toContain('status-running')
      expect(wrapper.find('.status-badge').classes()).toContain('status-running')
    })
  })

  describe('Actions', () => {
    it('should show cancel button for pending tasks', async () => {
      await wrapper.setProps({ 
        task: { ...mockTask, status: 'pending' } 
      })
      
      const cancelBtn = wrapper.find('.cancel-btn')
      expect(cancelBtn.exists()).toBe(true)
      expect(cancelBtn.text()).toBe('Cancel')
    })

    it('should show download button for completed tasks', async () => {
      await wrapper.setProps({ 
        task: { ...mockTask, status: 'completed' } 
      })
      
      const downloadBtn = wrapper.find('.download-btn')
      expect(downloadBtn.exists()).toBe(true)
      expect(downloadBtn.text()).toBe('Download')
    })

    it('should always show view details button', () => {
      const viewBtn = wrapper.find('.view-btn')
      expect(viewBtn.exists()).toBe(true)
      expect(viewBtn.text()).toBe('View Details')
    })

    it('should emit cancel event when cancel button is clicked', async () => {
      const cancelBtn = wrapper.find('.cancel-btn')
      await cancelBtn.trigger('click')
      
      expect(wrapper.emitted('cancel')).toBeTruthy()
      expect(wrapper.emitted('cancel')[0]).toEqual(['test-123'])
    })

    it('should emit download event when download button is clicked', async () => {
      await wrapper.setProps({ 
        task: { ...mockTask, status: 'completed' } 
      })
      
      const downloadBtn = wrapper.find('.download-btn')
      await downloadBtn.trigger('click')
      
      expect(wrapper.emitted('download')).toBeTruthy()
      expect(wrapper.emitted('download')[0]).toEqual(['test-123'])
    })

    it('should emit view event when view button is clicked', async () => {
      const viewBtn = wrapper.find('.view-btn')
      await viewBtn.trigger('click')
      
      expect(wrapper.emitted('view')).toBeTruthy()
      expect(wrapper.emitted('view')[0]).toEqual([mockTask])
    })
  })

  describe('Status Badge', () => {
    const statusTests = [
      { status: 'pending', expectedText: 'Pending' },
      { status: 'running', expectedText: 'Running' },
      { status: 'completed', expectedText: 'Completed' },
      { status: 'failed', expectedText: 'Failed' },
      { status: 'cancelled', expectedText: 'Cancelled' },
      { status: 'cancelling', expectedText: 'Cancelling' },
      { status: 'challenge_required', expectedText: 'Challenge Required' }
    ]

    statusTests.forEach(({ status, expectedText }) => {
      it(`should display correct text for ${status} status`, async () => {
        await wrapper.setProps({ 
          task: { ...mockTask, status } 
        })
        
        expect(wrapper.find('.status-badge').text()).toBe(expectedText)
      })
    })
  })

  describe('Default Values', () => {
    it('should use default title when none provided', async () => {
      await wrapper.setProps({ 
        task: { ...mockTask, title: null } 
      })
      
      expect(wrapper.find('.task-title').text()).toBe('Task test-123')
    })

    it('should handle missing optional fields', async () => {
      const minimalTask = {
        id: 'minimal',
        status: 'pending',
        createdAt: new Date().toISOString()
      }
      
      await wrapper.setProps({ task: minimalTask })
      
      const detailValues = wrapper.findAll('.detail-value')
      detailValues.forEach(value => {
        expect(['N/A', '']).toContain(value.text().trim())
      })
    })
  })
})