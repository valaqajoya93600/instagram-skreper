'use strict';

require('dotenv').config();
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const DATABASE_URL = process.env.DATABASE_URL;

async function seed() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log('Seeding database...');

    const sampleTasks = [
      { username: 'demo_user_1', status: 'completed', progress: 100 },
      { username: 'demo_user_2', status: 'processing', progress: 45 },
      { username: 'demo_user_3', status: 'pending', progress: 0 },
      { username: 'challenge_demo', status: 'challenge_required', progress: 0 },
      { username: 'ratelimit_demo', status: 'rate_limited', progress: 0 },
      { username: 'error_demo', status: 'failed', progress: 0 },
    ];

    for (const task of sampleTasks) {
      const taskId = uuidv4();
      await pool.query(
        `INSERT INTO scrape_tasks (id, username, status, progress, total_items, challenge_required, rate_limited, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          taskId,
          task.username,
          task.status,
          task.progress,
          task.status === 'completed' ? 15 : 0,
          task.status === 'challenge_required',
          task.status === 'rate_limited',
          task.status === 'failed' ? 'Instagram account not found or is private' : null
        ]
      );

      if (task.status === 'completed') {
        for (let i = 0; i < 15; i++) {
          await pool.query(
            `INSERT INTO scrape_results (id, task_id, post_id, post_url, caption, likes_count, comments_count)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)`,
            [
              taskId,
              `post_${task.username}_${i}`,
              `https://instagram.com/p/${task.username}_${i}`,
              `Post ${i + 1} by ${task.username}`,
              Math.floor(Math.random() * 1000),
              Math.floor(Math.random() * 100)
            ]
          );
        }
      }

      console.log(`✓ Seeded task: ${task.username} (${task.status})`);
    }

    console.log('\n✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
