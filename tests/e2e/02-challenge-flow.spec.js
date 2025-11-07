const { test, expect } = require('./fixtures/test-fixture');

test.describe('Challenge Flow', () => {
  test('should handle Instagram challenge requirement', async ({ page }) => {
    await page.goto('/');
    
    const username = 'test_challenge_user';
    await page.fill('#username', username);
    await page.click('#scrapeBtn');
    
    await page.waitForTimeout(1000);
    
    await expect(page.locator('.task-status').first()).toContainText('CHALLENGE REQUIRED', { timeout: 30000 });
    
    const resolveBtn = page.locator('button:has-text("Resolve Challenge")').first();
    await expect(resolveBtn).toBeVisible();
  });

  test('should open challenge modal and submit code', async ({ page }) => {
    await page.goto('/');
    
    const username = 'challenge_modal_test';
    await page.fill('#username', username);
    await page.click('#scrapeBtn');
    
    await page.waitForTimeout(1000);
    
    await expect(page.locator('.task-status').first()).toContainText('CHALLENGE REQUIRED', { timeout: 30000 });
    
    await page.click('button:has-text("Resolve Challenge")');
    
    const modal = page.locator('#challengeModal');
    await expect(modal).toHaveClass(/active/);
    
    await expect(modal.locator('h2')).toContainText('Challenge Required');
    
    await page.fill('#challengeCode', '123456');
    await page.click('button:has-text("Submit")');
    
    await expect(modal).not.toHaveClass(/active/);
    
    await expect(page.locator('.task-status').first()).toContainText(/PROCESSING|COMPLETED/, { timeout: 60000 });
  });

  test('should resolve challenge via API', async ({ apiHelper }) => {
    const username = 'api_challenge_test';
    const task = await apiHelper.createScrapeTask(username);
    
    const challengeTask = await apiHelper.waitForTaskStatus(task.taskId, 'challenge_required', 30000);
    
    expect(challengeTask.challengeRequired).toBe(true);
    expect(challengeTask.challengeType).toBeTruthy();
    
    const result = await apiHelper.resolveChallenge(task.taskId, '123456');
    expect(result.success).toBe(true);
    
    const completedTask = await apiHelper.waitForTaskStatus(task.taskId, 'completed', 60000);
    expect(completedTask.status).toBe('completed');
  });

  test('should close challenge modal on cancel', async ({ page }) => {
    await page.goto('/');
    
    const username = 'challenge_cancel_test';
    await page.fill('#username', username);
    await page.click('#scrapeBtn');
    
    await page.waitForTimeout(1000);
    
    await expect(page.locator('.task-status').first()).toContainText('CHALLENGE REQUIRED', { timeout: 30000 });
    
    await page.click('button:has-text("Resolve Challenge")');
    
    const modal = page.locator('#challengeModal');
    await expect(modal).toHaveClass(/active/);
    
    await page.click('button:has-text("Cancel")');
    
    await expect(modal).not.toHaveClass(/active/);
  });
});
