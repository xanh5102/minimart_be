require("dotenv").config();
const redis = require("redis");

// node-redis v4+ uses an options object and a promise-based API.
const options = {
    socket: {
        host: process.env.REDIS_URL || "127.0.0.1",
        port: Number(process.env.REDIS_PORT) || 6379,
    },
};
// Only send AUTH when a password is configured — a local Redis usually has none.
if (process.env.REDIS_PASSWORD) {
    options.password = process.env.REDIS_PASSWORD;
}

const redisClient = redis.createClient(options);

redisClient.on("connect", () => {
    console.log("Redis client connected");
});

redisClient.on("error", (error) => {
    console.log("Redis error:", error.message);
});

// v4+ requires an explicit connect(). Fire-and-forget at startup,
// like the Mongo connection — request handlers run after this resolves.
(async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.log("Redis connect failure:", error.message);
    }
})();

module.exports = redisClient;
