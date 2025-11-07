const { test, expect } = require('./fixtures/test-fixture');

test.describe('Rate Limiting', () => {
  test('should handle rate limiting gracefully', async ({ page }) => {
    await page.goto('/');
    
    const username = 'test_ratelimit_user';
    await page.fill('#username', username);
    await page.click('#scrapeBtn');
    
    await page.waitForTimeout(1000);
    
    await expect(page.locator('.task-status').first()).toContainText('RATE LIMITED', { timeout: 30000 });
    
    await page.click('button:has-text("View Details")');
    
    await expect(page.locator('.dialog, alert')).toBeTruthy();
  });

  test('should show rate limit details via API', async ({ apiHelper }) => {
    const username = 'api_ratelimit_test';
    const task = await apiHelper.createScrapeTask(username);
    
    const rateLimitedTask = await apiHelper.waitForTaskStatus(task.taskId, 'rate_limited', 30000);
    
    expect(rateLimitedTask.status).toBe('rate_limited');
    expect(rateLimitedTask.rateLimited).toBe(true);
    expect(rateLimitedTask.rateLimitResetAt).toBeTruthy();
    
    const resetTime = new Date(rateLimitedTask.rateLimitResetAt);
    expect(resetTime.getTime()).toBeGreaterThan(Date.now());
  });

  test('should display rate limit status badge', async ({ page }) => {
    await page.goto('/');
    
    const username = 'ratelimit_badge_test';
    await page.fill('#username', username);
    await page.click('#scrapeBtn');
    
    await page.waitForTimeout(1000);
    
    const statusBadge = page.locator('.task-status').first();
    await expect(statusBadge).toContainText('RATE LIMITED', { timeout: 30000 });
    await expect(statusBadge).toHaveClass(/status-rate_limited/);
  });
});
