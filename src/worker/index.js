'use strict';

require('dotenv').config();
const Queue = require('bull');
const { Pool } = require('pg');
const S3 = require('aws-sdk/clients/s3');
const { mockInstagramScraper } = require('./instagram-mock');

const DATABASE_URL = process.env.DATABASE_URL;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const MOCK_INSTAGRAM = process.env.MOCK_INSTAGRAM === 'true';

const pool = new Pool({ connectionString: DATABASE_URL });
const scrapeQueue = new Queue('scrape-tasks', REDIS_URL);

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_S3_ENDPOINT,
  s3ForcePathStyle: true,
});

async function ensureBucketExists() {
  const bucketName = process.env.AWS_S3_BUCKET;
  try {
    await s3.headBucket({ Bucket: bucketName }).promise();
    console.log(`Bucket ${bucketName} exists`);
  } catch (error) {
    if (error.statusCode === 404) {
      console.log(`Creating bucket ${bucketName}...`);
      await s3.createBucket({ Bucket: bucketName }).promise();
      console.log(`Bucket ${bucketName} created`);
    } else {
      throw error;
    }
  }
}

async function updateTaskStatus(taskId, updates) {
  const fields = Object.keys(updates).map((key, idx) => `${key} = $${idx + 2}`).join(', ');
  const values = [taskId, ...Object.values(updates)];
  
  await pool.query(
    `UPDATE scrape_tasks SET ${fields}, updated_at = NOW() WHERE id = $1`,
    values
  );
}

scrapeQueue.process(async (job) => {
  const { taskId, username, challengeResolved } = job.data;
  
  console.log(`Processing scrape task ${taskId} for username ${username}`);

  try {
    await updateTaskStatus(taskId, { status: 'processing' });

    if (MOCK_INSTAGRAM) {
      const result = await mockInstagramScraper(username, {
        onProgress: async (progress, totalItems) => {
          await updateTaskStatus(taskId, { progress, total_items: totalItems });
        },
      });

      if (result.challengeRequired) {
        console.log(`Challenge required for task ${taskId}`);
        await updateTaskStatus(taskId, {
          status: 'challenge_required',
          challenge_required: true,
          challenge_type: result.challengeType,
        });
        return;
      }

      if (result.rateLimited) {
        console.log(`Rate limited for task ${taskId}`);
        await updateTaskStatus(taskId, {
          status: 'rate_limited',
          rate_limited: true,
          rate_limit_reset_at: result.rateLimitResetAt,
        });
        throw new Error('Rate limited');
      }

      if (result.error) {
        console.error(`Error scraping ${username}:`, result.error);
        await updateTaskStatus(taskId, {
          status: 'failed',
          error_message: result.error,
        });
        throw new Error(result.error);
      }

      for (const post of result.posts) {
        await pool.query(
          `INSERT INTO scrape_results (id, task_id, post_id, post_url, caption, likes_count, comments_count)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)`,
          [taskId, post.id, post.url, post.caption, post.likesCount, post.commentsCount]
        );
      }

      const exportData = {
        taskId,
        username,
        scrapedAt: new Date().toISOString(),
        totalPosts: result.posts.length,
        posts: result.posts,
      };

      const exportKey = `exports/${taskId}.json`;
      await s3.putObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: exportKey,
        Body: JSON.stringify(exportData, null, 2),
        ContentType: 'application/json',
      }).promise();

      const exportUrl = process.env.AWS_S3_ENDPOINT 
        ? `${process.env.AWS_S3_ENDPOINT}/${process.env.AWS_S3_BUCKET}/${exportKey}`
        : `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${exportKey}`;

      await updateTaskStatus(taskId, {
        status: 'completed',
        progress: 100,
        export_url: exportUrl,
        completed_at: new Date(),
      });

      console.log(`Task ${taskId} completed successfully`);
    }
  } catch (error) {
    console.error(`Error processing task ${taskId}:`, error);
    
    if (error.message !== 'Rate limited') {
      await updateTaskStatus(taskId, {
        status: 'failed',
        error_message: error.message,
      });
    }
    
    throw error;
  }
});

async function start() {
  try {
    await ensureBucketExists();
    console.log('Worker started and listening for scrape tasks');
  } catch (error) {
    console.error('Failed to start worker:', error);
    process.exit(1);
  }
}

start();

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing worker');
  await scrapeQueue.close();
  await pool.end();
  process.exit(0);
});
