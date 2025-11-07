const { test, expect } = require('./fixtures/test-fixture');

test.describe('Task Monitoring', () => {
  test('should display all tasks in the list', async ({ page, apiHelper }) => {
    await apiHelper.createScrapeTask('monitor_user_1');
    await apiHelper.createScrapeTask('monitor_user_2');
    
    await page.goto('/');
    
    await expect(page.locator('.task-item')).toHaveCount(2, { timeout: 5000 });
    
    await expect(page.locator('.task-username')).toHaveCount(2);
  });

  test('should auto-refresh task list', async ({ page, apiHelper }) => {
    await page.goto('/');
    
    const initialCount = await page.locator('.task-item').count();
    
    await apiHelper.createScrapeTask('autorefresh_user');
    
    await expect(page.locator('.task-item')).toHaveCount(initialCount + 1, { timeout: 5000 });
  });

  test('should view task details', async ({ page }) => {
    await page.goto('/');
    
    const username = 'detail_view_user';
    await page.fill('#username', username);
    await page.click('#scrapeBtn');
    
    await page.waitForTimeout(1000);
    
    page.on('dialog', async dialog => {
      const message = dialog.message();
      expect(message).toContain('Task:');
      expect(message).toContain(`Username: ${username}`);
      expect(message).toContain('Status:');
      await dialog.accept();
    });
    
    await page.click('button:has-text("View Details")');
    
    await page.waitForTimeout(1000);
  });

  test('should filter tasks by status via API', async ({ request, apiHelper }) => {
    await apiHelper.createScrapeTask('completed_filter_user');
    
    const response = await request.get('/api/tasks?status=pending');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.tasks).toBeTruthy();
    
    data.tasks.forEach(task => {
      expect(task.status).toMatch(/pending|processing/);
    });
  });

  test('should show task creation timestamp', async ({ page }) => {
    await page.goto('/');
    
    const username = 'timestamp_user';
    await page.fill('#username', username);
    await page.click('#scrapeBtn');
    
    await page.waitForTimeout(1000);
    
    const taskInfo = page.locator('.task-info').first();
    await expect(taskInfo).toContainText('Created:');
    await expect(taskInfo).toContainText('Task ID:');
  });
});
