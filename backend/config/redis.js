const Redis = require('ioredis');

let redisConnection = null;

const getRedisConnection = () => {
  if (!redisConnection) {
    redisConnection = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      maxRetriesPerRequest: null, // Required for BullMQ
    });
    redisConnection.on('connect', () => console.log('✅ Redis connected'));
    redisConnection.on('error', (err) => console.error('❌ Redis error:', err.message));
  }
  return redisConnection;
};

module.exports = { getRedisConnection };
