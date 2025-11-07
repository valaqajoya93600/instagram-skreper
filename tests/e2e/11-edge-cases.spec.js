const { test, expect } = require('./fixtures/test-fixture');

test.describe('Edge Cases and Boundary Conditions', () => {
  test('should handle very long username input', async ({ page }) => {
    await page.goto('/');
    
    const longUsername = 'a'.repeat(255);
    await page.fill('#username', longUsername);
    await page.click('#scrapeBtn');
    
    await page.waitForTimeout(1000);
    
    await expect(page.locator('.task-item')).toHaveCount(1, { timeout: 5000 });
  });

  test('should handle special characters in username', async ({ page }) => {
    await page.goto('/');
    
    const specialUsername = 'test_user.123';
    await page.fill('#username', specialUsername);
    await page.click('#scrapeBtn');
    
    await page.waitForTimeout(1000);
    
    await expect(page.locator('.task-username')).toContainText(specialUsername);
  });

  test('should handle rapid consecutive task creation', async ({ apiHelper }) => {
    const tasks = [];
    
    for (let i = 0; i < 5; i++) {
      const task = await apiHelper.createScrapeTask(`rapid_${i}`);
      tasks.push(task);
    }
    
    expect(tasks).toHaveLength(5);
    tasks.forEach(task => {
      expect(task.taskId).toBeTruthy();
      expect(task.status).toBe('pending');
    });
  });

  test('should handle empty task list gracefully', async ({ page }) => {
    await page.goto('/');
    
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    await expect(page.locator('h2')).toContainText('Recent Tasks');
  });

  test('should persist task list across page refreshes', async ({ page, apiHelper }) => {
    const username = 'persist_test_user';
    await apiHelper.createScrapeTask(username);
    
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    await expect(page.locator('.task-username')).toContainText(`@${username}`);
    
    await page.reload();
    await page.waitForTimeout(1000);
    
    await expect(page.locator('.task-username')).toContainText(`@${username}`);
  });

  test('should handle concurrent challenge resolutions', async ({ request, apiHelper }) => {
    const task1 = await apiHelper.createScrapeTask('challenge_concurrent_1');
    const task2 = await apiHelper.createScrapeTask('challenge_concurrent_2');
    
    await apiHelper.waitForTaskStatus(task1.taskId, 'challenge_required', 30000);
    await apiHelper.waitForTaskStatus(task2.taskId, 'challenge_required', 30000);
    
    const [result1, result2] = await Promise.all([
      request.post(`/api/tasks/${task1.taskId}/resolve-challenge`, {
        data: { code: '123456' }
      }),
      request.post(`/api/tasks/${task2.taskId}/resolve-challenge`, {
        data: { code: '654321' }
      })
    ]);
    
    expect(result1.ok()).toBeTruthy();
    expect(result2.ok()).toBeTruthy();
  });

  test('should handle task with zero posts', async ({ apiHelper }) => {
    const username = 'zero_posts_user';
    const task = await apiHelper.createScrapeTask(username);
    
    const completedTask = await apiHelper.waitForTaskStatus(task.taskId, 'completed', 60000);
    
    expect(completedTask.status).toBe('completed');
    expect(completedTask.totalItems).toBeGreaterThanOrEqual(0);
  });

  test('should handle missing challenge code', async ({ request, apiHelper }) => {
    const username = 'missing_code_challenge';
    const task = await apiHelper.createScrapeTask(username);
    
    await apiHelper.waitForTaskStatus(task.taskId, 'challenge_required', 30000);
    
    const response = await request.post(`/api/tasks/${task.taskId}/resolve-challenge`, {
      data: {}
    });
    
    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.error).toContain('code');
  });

  test('should handle whitespace-only username', async ({ page }) => {
    await page.goto('/');
    
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('username');
      await dialog.accept();
    });
    
    await page.fill('#username', '   ');
    await page.click('#scrapeBtn');
    
    await page.waitForTimeout(500);
  });

  test('should handle browser back button navigation', async ({ page, apiHelper }) => {
    await apiHelper.createScrapeTask('nav_test_user');
    
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    await page.goto('http://localhost:3000/api/tasks');
    
    await page.goBack();
    
    await expect(page.locator('h1')).toContainText('Instagram Scraper');
  });

  test('should display correct task count in list', async ({ page, apiHelper }) => {
    const count = 3;
    for (let i = 0; i < count; i++) {
      await apiHelper.createScrapeTask(`count_test_${i}`);
    }
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const tasks = await page.locator('.task-item').count();
    expect(tasks).toBeGreaterThanOrEqual(count);
  });

  test('should handle API timeout gracefully', async ({ page, context }) => {
    await page.goto('/');
    
    await context.route('**/api/tasks', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.continue();
    });
    
    await page.waitForTimeout(2000);
  });
});
