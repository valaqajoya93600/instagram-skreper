const { test, expect } = require('./fixtures/test-fixture');

test.describe('API Integration Tests', () => {
  test('should return health check status', async ({ request }) => {
    const response = await request.get('/healthz');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toMatchObject({
      status: 'ok',
      uptimeSeconds: expect.any(Number),
      timestamp: expect.any(String)
    });
  });

  test('should create multiple tasks concurrently', async ({ request }) => {
    const usernames = ['concurrent_1', 'concurrent_2', 'concurrent_3'];
    
    const promises = usernames.map(username =>
      request.post('/api/scrape', {
        data: { username }
      })
    );
    
    const responses = await Promise.all(promises);
    
    responses.forEach(response => {
      expect(response.ok()).toBeTruthy();
    });
    
    const tasks = await Promise.all(responses.map(r => r.json()));
    
    expect(tasks).toHaveLength(3);
    tasks.forEach(task => {
      expect(task.taskId).toBeTruthy();
      expect(task.status).toBe('pending');
    });
  });

  test('should paginate task list', async ({ request, apiHelper }) => {
    for (let i = 0; i < 5; i++) {
      await apiHelper.createScrapeTask(`pagination_user_${i}`);
    }
    
    const response1 = await request.get('/api/tasks?limit=3&offset=0');
    expect(response1.ok()).toBeTruthy();
    const data1 = await response1.json();
    expect(data1.tasks.length).toBeLessThanOrEqual(3);
    
    const response2 = await request.get('/api/tasks?limit=3&offset=3');
    expect(response2.ok()).toBeTruthy();
    const data2 = await response2.json();
    expect(data2.tasks).toBeTruthy();
  });

  test('should handle CORS headers', async ({ request }) => {
    const response = await request.post('/api/scrape', {
      data: { username: 'cors_test' },
      headers: {
        'Origin': 'http://localhost:3001'
      }
    });
    
    expect(response.ok()).toBeTruthy();
  });

  test('should return proper content type for JSON endpoints', async ({ request }) => {
    const response = await request.get('/api/tasks');
    expect(response.ok()).toBeTruthy();
    
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('should validate request body schema', async ({ request }) => {
    const response = await request.post('/api/scrape', {
      data: { invalidField: 'value' }
    });
    
    expect(response.status()).toBe(400);
  });

  test('should handle malformed JSON gracefully', async ({ request }) => {
    const response = await request.post('/api/scrape', {
      data: 'not-a-json',
      headers: {
        'Content-Type': 'application/json'
      },
      failOnStatusCode: false
    });
    
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
