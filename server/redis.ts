import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL!, {
  // Reconnection strategy
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  enableOfflineQueue: true,
  
  // Connection pooling and retry
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  
  // Keep-alive settings
  keepAlive: 30000, // 30 seconds
  noDelay: true,
  
  // Connection timeout
  connectTimeout: 10000,
  commandTimeout: 5000,
  
  // Additional settings for stability
  lazyConnect: false,
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
});

// Handle connection lifecycle
redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('ready', () => {
  console.log('Redis ready to accept commands');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('close', () => {
  console.log('Redis connection closed');
});

redis.on('reconnecting', () => {
  console.log('Redis attempting to reconnect...');
});

export default redis;