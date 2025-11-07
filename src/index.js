'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const Queue = require('bull');
const { v4: uuidv4 } = require('uuid');
const S3 = require('aws-sdk/clients/s3');

const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const DATABASE_URL = process.env.DATABASE_URL;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const pool = new Pool({ connectionString: DATABASE_URL });
const scrapeQueue = new Queue('scrape-tasks', REDIS_URL);

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_S3_ENDPOINT,
  s3ForcePathStyle: true,
});

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/healthz', (req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/scrape', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const taskId = uuidv4();
    
    await pool.query(
      `INSERT INTO scrape_tasks (id, username, status, progress, total_items)
       VALUES ($1, $2, $3, $4, $5)`,
      [taskId, username, 'pending', 0, 0]
    );

    await scrapeQueue.add({ taskId, username });

    res.json({ taskId, username, status: 'pending' });
  } catch (error) {
    console.error('Error creating scrape task:', error);
    res.status(500).json({ error: 'Failed to create scrape task' });
  }
});

app.get('/api/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM scrape_tasks WHERE id = $1',
      [taskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = result.rows[0];
    res.json({
      id: task.id,
      username: task.username,
      status: task.status,
      progress: task.progress,
      totalItems: task.total_items,
      challengeRequired: task.challenge_required,
      challengeType: task.challenge_type,
      rateLimited: task.rate_limited,
      rateLimitResetAt: task.rate_limit_reset_at,
      errorMessage: task.error_message,
      exportUrl: task.export_url,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      completedAt: task.completed_at,
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

app.get('/api/tasks', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM scrape_tasks';
    const params = [];
    
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      tasks: result.rows.map(task => ({
        id: task.id,
        username: task.username,
        status: task.status,
        progress: task.progress,
        totalItems: task.total_items,
        createdAt: task.created_at,
        completedAt: task.completed_at,
      })),
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks/:taskId/cancel', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const result = await pool.query(
      `UPDATE scrape_tasks 
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND status IN ('pending', 'processing')
       RETURNING *`,
      ['cancelled', taskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or cannot be cancelled' });
    }

    const jobs = await scrapeQueue.getJobs(['waiting', 'active', 'delayed']);
    for (const job of jobs) {
      if (job.data.taskId === taskId) {
        await job.remove();
      }
    }

    res.json({ success: true, status: 'cancelled' });
  } catch (error) {
    console.error('Error cancelling task:', error);
    res.status(500).json({ error: 'Failed to cancel task' });
  }
});

app.get('/api/tasks/:taskId/download', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM scrape_tasks WHERE id = $1',
      [taskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = result.rows[0];

    if (task.status !== 'completed') {
      return res.status(400).json({ error: 'Task is not completed yet' });
    }

    if (!task.export_url) {
      return res.status(404).json({ error: 'Export file not found' });
    }

    const key = task.export_url.split('/').pop();
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    };

    const stream = s3.getObject(params).createReadStream();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${task.username}-${taskId}.json"`);
    
    stream.pipe(res);
  } catch (error) {
    console.error('Error downloading export:', error);
    res.status(500).json({ error: 'Failed to download export' });
  }
});

app.post('/api/tasks/:taskId/resolve-challenge', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Challenge code is required' });
    }

    const result = await pool.query(
      `UPDATE scrape_tasks 
       SET challenge_required = false, status = 'processing', updated_at = NOW()
       WHERE id = $1 AND challenge_required = true
       RETURNING *`,
      [taskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or no challenge required' });
    }

    await scrapeQueue.add({ taskId, username: result.rows[0].username, challengeResolved: true });

    res.json({ success: true, status: 'processing' });
  } catch (error) {
    console.error('Error resolving challenge:', error);
    res.status(500).json({ error: 'Failed to resolve challenge' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end();
    process.exit(0);
  });
});
