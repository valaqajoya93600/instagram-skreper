const { test, expect } = require('./fixtures/test-fixture');

test.describe('Task Cancellation', () => {
  test('should cancel pending task from UI', async ({ page }) => {
    await page.goto('/');
    
    const username = 'cancel_ui_user';
    await page.fill('#username', username);
    await page.click('#scrapeBtn');
    
    await page.waitForTimeout(1000);
    
    const cancelBtn = page.locator('button:has-text("Cancel")').first();
    await expect(cancelBtn).toBeVisible();
    
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('cancel');
      await dialog.accept();
    });
    
    await cancelBtn.click();
    
    await page.waitForTimeout(1000);
    
    const statusBadge = page.locator('.task-status').first();
    await expect(statusBadge).toContainText('CANCELLED', { timeout: 5000 });
    
    await expect(cancelBtn).not.toBeVisible();
  });

  test('should cancel task via API', async ({ apiHelper }) => {
    const username = 'cancel_api_user';
    const task = await apiHelper.createScrapeTask(username);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = await apiHelper.cancelTask(task.taskId);
    expect(result.success).toBe(true);
    expect(result.status).toBe('cancelled');
    
    const cancelledTask = await apiHelper.getTask(task.taskId);
    expect(cancelledTask.status).toBe('cancelled');
  });

  test('should not allow cancellation of completed tasks', async ({ request, apiHelper }) => {
    const username = 'no_cancel_completed';
    const task = await apiHelper.createScrapeTask(username);
    
    await apiHelper.waitForTaskStatus(task.taskId, 'completed', 60000);
    
    const response = await request.post(`/api/tasks/${task.taskId}/cancel`);
    expect(response.status()).toBe(404);
  });

  test('should hide cancel button for completed tasks', async ({ page, apiHelper }) => {
    const username = 'hide_cancel_button';
    const task = await apiHelper.createScrapeTask(username);
    
    await apiHelper.waitForTaskStatus(task.taskId, 'completed', 60000);
    
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    const taskItem = page.locator('.task-item').first();
    const cancelBtn = taskItem.locator('button:has-text("Cancel")');
    
    await expect(cancelBtn).not.toBeVisible();
  });

  test('should reject cancellation dialog', async ({ page }) => {
    await page.goto('/');
    
    const username = 'reject_cancel_user';
    await page.fill('#username', username);
    await page.click('#scrapeBtn');
    
    await page.waitForTimeout(1000);
    
    const statusBefore = await page.locator('.task-status').first().textContent();
    
    page.on('dialog', async dialog => {
      await dialog.dismiss();
    });
    
    await page.click('button:has-text("Cancel")');
    
    await page.waitForTimeout(1000);
    
    const statusAfter = await page.locator('.task-status').first().textContent();
    expect(statusAfter).toBe(statusBefore);
  });
});
