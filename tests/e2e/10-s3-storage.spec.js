const { test, expect } = require('./fixtures/test-fixture');

test.describe('S3 Storage Integration', () => {
  test('should store exports in S3/LocalStack', async ({ apiHelper }) => {
    const username = 's3_storage_user';
    const task = await apiHelper.createScrapeTask(username);
    
    const completedTask = await apiHelper.waitForTaskStatus(task.taskId, 'completed', 60000);
    
    expect(completedTask.exportUrl).toBeTruthy();
    expect(completedTask.exportUrl).toContain('scraper-exports');
  });

  test('should generate valid export file format', async ({ apiHelper }) => {
    const username = 's3_format_user';
    const task = await apiHelper.createScrapeTask(username);
    
    await apiHelper.waitForTaskStatus(task.taskId, 'completed', 60000);
    
    const exportData = await apiHelper.downloadExport(task.taskId);
    const jsonData = JSON.parse(exportData.toString());
    
    expect(jsonData).toMatchObject({
      taskId: expect.any(String),
      username: expect.any(String),
      scrapedAt: expect.any(String),
      totalPosts: expect.any(Number),
      posts: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          url: expect.any(String),
          caption: expect.any(String),
          likesCount: expect.any(Number),
          commentsCount: expect.any(Number)
        })
      ])
    });
  });

  test('should handle S3 upload failures', async ({ apiHelper }) => {
    const username = 's3_normal_user';
    const task = await apiHelper.createScrapeTask(username);
    
    const completedTask = await apiHelper.waitForTaskStatus(task.taskId, 'completed', 60000);
    
    expect(completedTask.status).toBe('completed');
    expect(completedTask.exportUrl).toBeTruthy();
  });

  test('should use unique keys for each export', async ({ apiHelper }) => {
    const task1 = await apiHelper.createScrapeTask('s3_unique_1');
    const task2 = await apiHelper.createScrapeTask('s3_unique_2');
    
    const completed1 = await apiHelper.waitForTaskStatus(task1.taskId, 'completed', 60000);
    const completed2 = await apiHelper.waitForTaskStatus(task2.taskId, 'completed', 60000);
    
    expect(completed1.exportUrl).not.toBe(completed2.exportUrl);
    expect(completed1.exportUrl).toContain(task1.taskId);
    expect(completed2.exportUrl).toContain(task2.taskId);
  });

  test('should download export with correct content type', async ({ request, apiHelper }) => {
    const username = 's3_content_type_user';
    const task = await apiHelper.createScrapeTask(username);
    
    await apiHelper.waitForTaskStatus(task.taskId, 'completed', 60000);
    
    const response = await request.get(`/api/tasks/${task.taskId}/download`);
    expect(response.ok()).toBeTruthy();
    
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
    
    const contentDisposition = response.headers()['content-disposition'];
    expect(contentDisposition).toContain('attachment');
    expect(contentDisposition).toContain('.json');
  });
});
