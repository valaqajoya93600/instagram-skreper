const { test, expect } = require('./fixtures/test-fixture');

test.describe('Export Download', () => {
  test('should download completed task export', async ({ page, apiHelper }) => {
    const username = 'download_test_user';
    const task = await apiHelper.createScrapeTask(username);
    
    await apiHelper.waitForTaskStatus(task.taskId, 'completed', 60000);
    
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    const downloadBtn = page.locator('button:has-text("Download Export")').first();
    await expect(downloadBtn).toBeVisible({ timeout: 5000 });
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      downloadBtn.click()
    ]);
    
    expect(download.suggestedFilename()).toContain(username);
    expect(download.suggestedFilename()).toContain('.json');
  });

  test('should download export via API', async ({ apiHelper }) => {
    const username = 'api_download_user';
    const task = await apiHelper.createScrapeTask(username);
    
    const completedTask = await apiHelper.waitForTaskStatus(task.taskId, 'completed', 60000);
    expect(completedTask.exportUrl).toBeTruthy();
    
    const exportData = await apiHelper.downloadExport(task.taskId);
    expect(exportData).toBeTruthy();
    
    const jsonData = JSON.parse(exportData.toString());
    expect(jsonData).toMatchObject({
      taskId: task.taskId,
      username: username,
      totalPosts: expect.any(Number),
      posts: expect.any(Array)
    });
    
    expect(jsonData.posts.length).toBeGreaterThan(0);
    expect(jsonData.posts[0]).toMatchObject({
      id: expect.any(String),
      url: expect.any(String),
      caption: expect.any(String),
      likesCount: expect.any(Number),
      commentsCount: expect.any(Number)
    });
  });

  test('should not show download button for incomplete tasks', async ({ page }) => {
    await page.goto('/');
    
    const username = 'incomplete_download_user';
    await page.fill('#username', username);
    await page.click('#scrapeBtn');
    
    await page.waitForTimeout(2000);
    
    const taskItem = page.locator('.task-item').first();
    const downloadBtn = taskItem.locator('button:has-text("Download Export")');
    
    await expect(downloadBtn).not.toBeVisible();
  });

  test('should handle download errors gracefully', async ({ request }) => {
    const response = await request.get('/api/tasks/invalid-task-id/download');
    expect(response.status()).toBe(404);
    
    const error = await response.json();
    expect(error.error).toBeTruthy();
  });
});
