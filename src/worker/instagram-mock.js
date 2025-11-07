'use strict';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shouldTriggerChallenge(username) {
  return username.includes('challenge') || username === 'test_challenge_user';
}

function shouldTriggerRateLimit(username) {
  return username.includes('ratelimit') || username === 'test_ratelimit_user';
}

function shouldTriggerError(username) {
  return username.includes('error') || username === 'test_error_user';
}

async function mockInstagramScraper(username, options = {}) {
  const { onProgress } = options;

  await sleep(500);

  if (shouldTriggerChallenge(username)) {
    return {
      challengeRequired: true,
      challengeType: 'sms',
      posts: [],
    };
  }

  if (shouldTriggerRateLimit(username)) {
    const resetAt = new Date(Date.now() + 60 * 60 * 1000);
    return {
      rateLimited: true,
      rateLimitResetAt: resetAt,
      posts: [],
    };
  }

  if (shouldTriggerError(username)) {
    return {
      error: 'Instagram account not found or is private',
      posts: [],
    };
  }

  const totalPosts = Math.floor(Math.random() * 20) + 10;
  const posts = [];

  for (let i = 0; i < totalPosts; i++) {
    await sleep(200);

    posts.push({
      id: `post_${username}_${i}`,
      url: `https://instagram.com/p/${username}_${i}`,
      caption: `Post ${i + 1} by ${username}`,
      likesCount: Math.floor(Math.random() * 1000),
      commentsCount: Math.floor(Math.random() * 100),
    });

    if (onProgress) {
      await onProgress(Math.round(((i + 1) / totalPosts) * 100), totalPosts);
    }
  }

  return {
    posts,
    challengeRequired: false,
    rateLimited: false,
  };
}

module.exports = { mockInstagramScraper };
