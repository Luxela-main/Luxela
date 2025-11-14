import { Redis } from "ioredis";
const redis = new Redis(process.env.REDIS_URL!);

(async () => {
  try {
    await redis.set("test", "connected!");
    const value = await redis.get("test");
    console.log("Redis connected successfully. Value:", value);
    await redis.quit();
  } catch (err) {
    console.error("Redis connection failed:", err);
  }
})();
