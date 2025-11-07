'use strict';

const http = require('node:http');
const { URL } = require('node:url');
const WebSocket = require('ws');

const PORT = Number.parseInt(process.env.PORT || '3000', 10);

// In-memory task storage
let tasks = [
  {
    id: '1',
    title: 'Instagram User Scrape - @johndoe',
    status: 'completed',
    target: 'https://instagram.com/johndoe',
    maxFollowers: 1000,
    exportFormat: 'json',
    progress: 100,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    results: {
      count: 856,
      fileSize: 2048
    }
  },
  {
    id: '2',
    title: 'Instagram User Scrape - @janedoe',
    status: 'running',
    target: 'https://instagram.com/janedoe',
    maxFollowers: 500,
    exportFormat: 'csv',
    progress: 65,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Instagram User Scrape - @mike',
    status: 'failed',
    target: 'https://instagram.com/mike',
    maxFollowers: 2000,
    exportFormat: 'excel',
    progress: 0,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    error: 'Instagram API rate limit exceeded'
  },
  {
    id: '4',
    title: 'Instagram User Scrape - @sarah',
    status: 'pending',
    target: 'https://instagram.com/sarah',
    maxFollowers: 750,
    exportFormat: 'json',
    progress: 0,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    title: 'Instagram User Scrape - @alex',
    status: 'challenge_required',
    target: 'https://instagram.com/alex',
    maxFollowers: 1500,
    exportFormat: 'csv',
    progress: 0,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    challenge: 'Please verify your email address to continue'
  }
];

let taskIdCounter = tasks.length + 1;
const wsClients = new Set();

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  wsClients.add(ws);

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    wsClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    wsClients.delete(ws);
  });
});

// Broadcast function to send updates to all connected clients
function broadcast(message) {
  const messageStr = JSON.stringify(message);
  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Simulate task progress updates
function simulateTaskProgress() {
  const runningTasks = tasks.filter(task => task.status === 'running');
  
  runningTasks.forEach(task => {
    task.progress += Math.random() * 10;
    task.updatedAt = new Date().toISOString();
    
    if (task.progress >= 100) {
      task.status = 'completed';
      task.progress = 100;
      task.results = {
        count: Math.floor(Math.random() * 1000) + 100,
        fileSize: Math.floor(Math.random() * 5000) + 1000
      };
      
      broadcast({
        type: 'TASK_COMPLETED',
        payload: {
          taskId: task.id,
          results: task.results
        }
      });
    } else {
      broadcast({
        type: 'TASK_STATUS_UPDATE',
        payload: {
          taskId: task.id,
          status: task.status,
          progress: Math.round(task.progress)
        }
      });
    }
  });
}

// Simulate random task failures
function simulateTaskFailures() {
  const runningTasks = tasks.filter(task => task.status === 'running');
  
  if (runningTasks.length > 0 && Math.random() < 0.1) {
    const randomTask = runningTasks[Math.floor(Math.random() * runningTasks.length)];
    randomTask.status = 'failed';
    randomTask.error = 'Simulated network error';
    randomTask.updatedAt = new Date().toISOString();
    
    broadcast({
      type: 'TASK_FAILED',
      payload: {
        taskId: randomTask.id,
        error: randomTask.error
      }
    });
  }
}

// Start simulation intervals
setInterval(simulateTaskProgress, 3000);
setInterval(simulateTaskFailures, 10000);

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (requestUrl.pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        uptimeSeconds: process.uptime(),
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // Get tasks endpoint
  if (requestUrl.pathname === '/api/v1/tasks' && req.method === 'GET') {
    const page = parseInt(requestUrl.searchParams.get('page')) || 1;
    const limit = parseInt(requestUrl.searchParams.get('limit')) || 20;
    const status = requestUrl.searchParams.get('status');
    const timeRange = requestUrl.searchParams.get('timeRange');

    let filteredTasks = [...tasks];

    // Apply status filter
    if (status && status !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }

    // Apply time range filter
    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      const filterTime = new Date();
      
      switch (timeRange) {
        case '1h':
          filterTime.setHours(now.getHours() - 1);
          break;
        case '24h':
          filterTime.setDate(now.getDate() - 1);
          break;
        case '7d':
          filterTime.setDate(now.getDate() - 7);
          break;
        case '30d':
          filterTime.setDate(now.getDate() - 30);
          break;
      }
      
      filteredTasks = filteredTasks.filter(task => new Date(task.createdAt) >= filterTime);
    }

    // Sort by creation date (newest first)
    filteredTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const total = filteredTasks.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      tasks: paginatedTasks,
      currentPage: page,
      totalPages,
      total,
      limit
    }));
    return;
  }

  // Create task endpoint
  if (requestUrl.pathname === '/api/v1/tasks' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const taskData = JSON.parse(body);
        const newTask = {
          id: String(taskIdCounter++),
          title: taskData.title || `Instagram User Scrape - ${taskData.username}`,
          status: 'pending',
          target: taskData.target,
          maxFollowers: taskData.maxFollowers,
          exportFormat: taskData.exportFormat,
          progress: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        tasks.push(newTask);

        // Broadcast task creation
        broadcast({
          type: 'TASK_CREATED',
          payload: { task: newTask }
        });

        // Simulate task starting after a short delay
        setTimeout(() => {
          newTask.status = 'running';
          newTask.progress = 0;
          newTask.updatedAt = new Date().toISOString();
          
          broadcast({
            type: 'TASK_STATUS_UPDATE',
            payload: {
              taskId: newTask.id,
              status: 'running',
              progress: 0
            }
          });
        }, 2000);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newTask));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Cancel task endpoint
  if (requestUrl.pathname.match(/^\/api\/v1\/tasks\/\w+\/cancel$/) && req.method === 'POST') {
    const taskId = requestUrl.pathname.split('/')[4];
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Task not found' }));
      return;
    }

    if (!['pending', 'running'].includes(task.status)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Task cannot be cancelled' }));
      return;
    }

    task.status = 'cancelled';
    task.updatedAt = new Date().toISOString();

    // Broadcast task cancellation
    broadcast({
      type: 'TASK_CANCELLED',
      payload: { taskId: task.id }
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Task cancelled successfully' }));
    return;
  }

  // Download results endpoint
  if (requestUrl.pathname.match(/^\/api\/v1\/tasks\/\w+\/download$/) && req.method === 'GET') {
    const taskId = requestUrl.pathname.split('/')[4];
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Task not found' }));
      return;
    }

    if (task.status !== 'completed') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Task not completed' }));
      return;
    }

    // Mock file download
    const mockData = JSON.stringify(task.results, null, 2);
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="task-${taskId}-results.json"`
    });
    res.end(mockData);
    return;
  }

  // Default response
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      message: 'Railway deployment automation task monitor API',
      healthcheck: '/healthz',
      endpoints: {
        tasks: '/api/v1/tasks',
        createTask: 'POST /api/v1/tasks',
        cancelTask: 'POST /api/v1/tasks/{id}/cancel',
        downloadResults: 'GET /api/v1/tasks/{id}/download',
        websocket: 'ws://localhost:8080'
      }
    })
  );
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP server listening on port ${PORT}`);
  console.log(`WebSocket server listening on port 8080`);
  console.log(`API endpoints available:`);
  console.log(`  GET  /api/v1/tasks - Get tasks with pagination and filtering`);
  console.log(`  POST /api/v1/tasks - Create new task`);
  console.log(`  POST /api/v1/tasks/{id}/cancel - Cancel task`);
  console.log(`  GET  /api/v1/tasks/{id}/download - Download task results`);
  console.log(`  WS   ws://localhost:8080 - WebSocket for real-time updates`);
});