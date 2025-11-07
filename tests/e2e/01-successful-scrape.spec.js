const { test, expect } = require('./fixtures/test-fixture');

test.describe('Successful Scrape Workflow', () => {
  test('should successfully scrape an Instagram account', async ({ page, apiHelper }) => {
    await page.goto('/');
    
    await expect(page.locator('h1')).toContainText('Instagram Scraper');
    
    const username = 'test_success_user';
    await page.fill('#username', username);
    await page.click('#scrapeBtn');
    
    await page.waitForTimeout(1000);
    
    await expect(page.locator('.task-username')).toContainText(`@${username}`);
    
    await expect(page.locator('.task-status').first()).toContainText(/PENDING|PROCESSING/, { timeout: 5000 });
    
    await expect(page.locator('.task-status').first()).toContainText('COMPLETED', { timeout: 60000 });
    
    const downloadBtn = page.locator('button:has-text("Download Export")').first();
    await expect(downloadBtn).toBeVisible();
  });

  test('should create scrape task via API and monitor progress', async ({ apiHelper }) => {
    const username = 'api_test_user';
    const task = await apiHelper.createScrapeTask(username);
    
    expect(task).toMatchObject({
      taskId: expect.any(String),
      username: username,
      status: 'pending'
    });
    
    let currentTask = await apiHelper.getTask(task.taskId);
    expect(currentTask.status).toMatch(/pending|processing/);
    
    const completedTask = await apiHelper.waitForTaskStatus(task.taskId, 'completed', 60000);
    
    expect(completedTask.status).toBe('completed');
    expect(completedTask.progress).toBe(100);
    expect(completedTask.exportUrl).toBeTruthy();
    expect(completedTask.totalItems).toBeGreaterThan(0);
  });

  test('should display progress bar during scraping', async ({ page }) => {
    await page.goto('/');
    
    const username = 'progress_test_user';
    await page.fill('#username', username);
    await page.click('#scrapeBtn');
    
    await page.waitForTimeout(1000);
    
    const progressBar = page.locator('.progress-bar').first();
    await expect(progressBar).toBeVisible({ timeout: 10000 });
    
    const progressFill = progressBar.locator('.progress-fill');
    await expect(progressFill).toBeVisible();
    
    await expect(page.locator('.task-status').first()).toContainText('COMPLETED', { timeout: 60000 });
    
    await expect(progressBar).not.toBeVisible();
  });
});
