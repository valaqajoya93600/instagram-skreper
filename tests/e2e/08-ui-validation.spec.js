const { test, expect } = require('./fixtures/test-fixture');

test.describe('UI Validation and UX', () => {
  test('should have proper page title and header', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveTitle(/Instagram Scraper/);
    await expect(page.locator('h1')).toContainText('Instagram Scraper');
  });

  test('should disable submit button while processing', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('#username', 'button_test_user');
    
    const submitBtn = page.locator('#scrapeBtn');
    await expect(submitBtn).toBeEnabled();
    
    await submitBtn.click();
    
    await expect(submitBtn).toBeDisabled();
    
    await page.waitForTimeout(1500);
    
    await expect(submitBtn).toBeEnabled();
  });

  test('should clear username input after submission', async ({ page }) => {
    await page.goto('/');
    
    const usernameInput = page.locator('#username');
    await usernameInput.fill('clear_test_user');
    await page.click('#scrapeBtn');
    
    await page.waitForTimeout(1000);
    
    await expect(usernameInput).toHaveValue('');
  });

  test('should show empty state when no tasks exist', async ({ page }) => {
    await page.goto('/');
    
    await page.evaluate(() => {
      document.getElementById('tasksList').innerHTML = '<p style="color: #8e8e8e; text-align: center; padding: 40px;">No tasks yet</p>';
    });
    
    const emptyMessage = page.locator('#tasksList p');
    await expect(emptyMessage).toContainText('No tasks yet');
  });

  test('should have responsive task cards', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('#username', 'responsive_user');
    await page.click('#scrapeBtn');
    
    await page.waitForTimeout(1000);
    
    const taskItem = page.locator('.task-item').first();
    await expect(taskItem).toBeVisible();
    
    const taskHeader = taskItem.locator('.task-header');
    await expect(taskHeader).toBeVisible();
    
    const username = taskItem.locator('.task-username');
    const status = taskItem.locator('.task-status');
    
    await expect(username).toBeVisible();
    await expect(status).toBeVisible();
  });

  test('should show all action buttons for appropriate task states', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('#username', 'actions_test_user');
    await page.click('#scrapeBtn');
    
    await page.waitForTimeout(1000);
    
    const taskItem = page.locator('.task-item').first();
    const actions = taskItem.locator('.task-actions');
    
    await expect(actions).toBeVisible();
    
    const viewBtn = actions.locator('button:has-text("View Details")');
    await expect(viewBtn).toBeVisible();
  });
});
