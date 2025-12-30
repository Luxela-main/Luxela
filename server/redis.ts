import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);

// Test connection
redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export default redis;