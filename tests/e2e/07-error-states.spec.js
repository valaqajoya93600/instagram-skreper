const { test, expect } = require('./fixtures/test-fixture');

test.describe('Error States', () => {
  test('should handle scraping errors', async ({ page }) => {
    await page.goto('/');
    
    const username = 'test_error_user';
    await page.fill('#username', username);
    await page.click('#scrapeBtn');
    
    await page.waitForTimeout(1000);
    
    await expect(page.locator('.task-status').first()).toContainText('FAILED', { timeout: 30000 });
  });

  test('should show error message via API', async ({ apiHelper }) => {
    const username = 'api_error_user';
    const task = await apiHelper.createScrapeTask(username);
    
    const failedTask = await apiHelper.waitForTaskStatus(task.taskId, 'failed', 30000);
    
    expect(failedTask.status).toBe('failed');
    expect(failedTask.errorMessage).toBeTruthy();
    expect(failedTask.errorMessage).toContain('not found');
  });

  test('should validate required username field', async ({ page }) => {
    await page.goto('/');
    
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('username');
      await dialog.accept();
    });
    
    await page.click('#scrapeBtn');
    
    await page.waitForTimeout(500);
  });

  test('should handle API errors gracefully', async ({ request }) => {
    const response = await request.post('/api/scrape', {
      data: { username: '' }
    });
    
    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.error).toContain('Username is required');
  });

  test('should handle network errors', async ({ page, context }) => {
    await page.goto('/');
    
    await context.route('**/api/scrape', route => route.abort());
    
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Error');
      await dialog.accept();
    });
    
    await page.fill('#username', 'test_user');
    await page.click('#scrapeBtn');
    
    await page.waitForTimeout(1000);
  });

  test('should handle 404 for non-existent task', async ({ request }) => {
    const response = await request.get('/api/tasks/non-existent-task-id');
    expect(response.status()).toBe(404);
    
    const error = await response.json();
    expect(error.error).toBe('Task not found');
  });

  test('should display failed status badge with correct styling', async ({ page }) => {
    await page.goto('/');
    
    const username = 'failed_badge_test';
    await page.fill('#username', username);
    await page.click('#scrapeBtn');
    
    await page.waitForTimeout(1000);
    
    const statusBadge = page.locator('.task-status').first();
    await expect(statusBadge).toContainText('FAILED', { timeout: 30000 });
    await expect(statusBadge).toHaveClass(/status-failed/);
  });
});
