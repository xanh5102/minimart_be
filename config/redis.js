require("dotenv").config();
const redis = require("redis");

// In-memory fallback store when Redis server is offline
class MemoryStore {
  constructor() {
    this.store = new Map();
    this.timers = new Map();
  }

  async get(key) {
    return this.store.get(String(key)) ?? null;
  }

  async set(key, value, options) {
    const k = String(key);
    this.store.set(k, String(value));
    if (this.timers.has(k)) {
      clearTimeout(this.timers.get(k));
      this.timers.delete(k);
    }
    if (options && options.EX) {
      const timer = setTimeout(() => {
        this.store.delete(k);
        this.timers.delete(k);
      }, options.EX * 1000);
      if (timer.unref) timer.unref();
      this.timers.set(k, timer);
    }
    return "OK";
  }

  async del(key) {
    const k = String(key);
    if (this.timers.has(k)) {
      clearTimeout(this.timers.get(k));
      this.timers.delete(k);
    }
    return this.store.delete(k) ? 1 : 0;
  }
}

const memoryStore = new MemoryStore();
let isRedisReady = false;
let fallbackWarned = false;

const warnFallbackOnce = () => {
  if (!fallbackWarned) {
    fallbackWarned = true;
    console.warn(
      "[Redis Fallback] Redis is offline. Using in-memory fallback store for tokens and cache.",
    );
  }
};

// node-redis configuration
const options = {
  socket: {
    host: process.env.REDIS_URL || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    reconnectStrategy: (retries) => {
      if (retries >= 3) {
        warnFallbackOnce();
        return false; // Stop reconnecting after 3 retries
      }
      return 1000;
    },
  },
};

if (process.env.REDIS_PASSWORD) {
  options.password = process.env.REDIS_PASSWORD;
}

const rawRedisClient = redis.createClient(options);

rawRedisClient.on("ready", () => {
  isRedisReady = true;
  console.log("Redis client connected and ready");
});

rawRedisClient.on("end", () => {
  isRedisReady = false;
});

rawRedisClient.on("error", (error) => {
  isRedisReady = false;
  if (!fallbackWarned) {
    console.log("Redis connection error:", error.message);
  }
});

// Explicit connect with graceful fallback
(async () => {
  try {
    await rawRedisClient.connect();
  } catch (error) {
    warnFallbackOnce();
  }
})();

// Proxy client so existing callers transparently get Redis or Fallback
const redisClientProxy = new Proxy(rawRedisClient, {
  get(target, prop) {
    if (prop === "get") {
      return async (key) => {
        if (isRedisReady) {
          try {
            return await target.get(key);
          } catch (err) {
            warnFallbackOnce();
            return await memoryStore.get(key);
          }
        }
        warnFallbackOnce();
        return await memoryStore.get(key);
      };
    }
    if (prop === "set") {
      return async (key, value, opt) => {
        if (isRedisReady) {
          try {
            return await target.set(key, value, opt);
          } catch (err) {
            warnFallbackOnce();
            return await memoryStore.set(key, value, opt);
          }
        }
        warnFallbackOnce();
        return await memoryStore.set(key, value, opt);
      };
    }
    if (prop === "del") {
      return async (key) => {
        if (isRedisReady) {
          try {
            return await target.del(key);
          } catch (err) {
            warnFallbackOnce();
            return await memoryStore.del(key);
          }
        }
        warnFallbackOnce();
        return await memoryStore.del(key);
      };
    }
    if (prop === "isFallback") {
      return !isRedisReady;
    }

    const value = target[prop];
    if (typeof value === "function") {
      return value.bind(target);
    }
    return value;
  },
});

module.exports = redisClientProxy;
