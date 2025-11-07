const { test as base, expect } = require('@playwright/test');

const test = base.extend({
  apiHelper: async ({ request }, use) => {
    const helper = {
      async createScrapeTask(username) {
        const response = await request.post('/api/scrape', {
          data: { username }
        });
        expect(response.ok()).toBeTruthy();
        return await response.json();
      },

      async getTask(taskId) {
        const response = await request.get(`/api/tasks/${taskId}`);
        expect(response.ok()).toBeTruthy();
        return await response.json();
      },

      async waitForTaskStatus(taskId, expectedStatus, timeout = 30000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
          const task = await this.getTask(taskId);
          if (task.status === expectedStatus) {
            return task;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        throw new Error(`Task ${taskId} did not reach status ${expectedStatus} within ${timeout}ms`);
      },

      async cancelTask(taskId) {
        const response = await request.post(`/api/tasks/${taskId}/cancel`);
        expect(response.ok()).toBeTruthy();
        return await response.json();
      },

      async resolveChallenge(taskId, code = '123456') {
        const response = await request.post(`/api/tasks/${taskId}/resolve-challenge`, {
          data: { code }
        });
        expect(response.ok()).toBeTruthy();
        return await response.json();
      },

      async downloadExport(taskId) {
        const response = await request.get(`/api/tasks/${taskId}/download`);
        expect(response.ok()).toBeTruthy();
        return await response.body();
      }
    };
    
    await use(helper);
  }
});

module.exports = { test, expect };
