const Redis = require('ioredis');
const logger = require('./logger');

// Initialize Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

class InventoryCache {
  static CACHE_TTL = 300; // 5 minutes in seconds

  static async getInventory(key) {
    try {
      const cachedData = await redis.get(key);
      if (cachedData) {
        logger.info(`Cache hit for key: ${key}`);
        return JSON.parse(cachedData);
      }
      logger.info(`Cache miss for key: ${key}`);
      return null;
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  }

  static async setInventory(key, data) {
    try {
      await redis.setex(key, this.CACHE_TTL, JSON.stringify(data));
      logger.info(`Cache set for key: ${key}`);
    } catch (error) {
      logger.error('Redis set error:', error);
    }
  }

  static async invalidateInventory(key) {
    try {
      await redis.del(key);
      logger.info(`Cache invalidated for key: ${key}`);
    } catch (error) {
      logger.error('Redis delete error:', error);
    }
  }

  static generateKey(pharmacyId, medicineId) {
    return `inventory:${pharmacyId}:${medicineId}`;
  }

  static generateLocationKey(lat, lng, radius) {
    return `inventory:location:${lat}:${lng}:${radius}`;
  }

  // Batch operations for multiple inventory items
  static async batchGetInventory(keys) {
    try {
      const cachedData = await redis.mget(keys);
      return cachedData.map(item => item ? JSON.parse(item) : null);
    } catch (error) {
      logger.error('Redis batch get error:', error);
      return keys.map(() => null);
    }
  }

  static async batchSetInventory(keyValuePairs) {
    try {
      const pipeline = redis.pipeline();
      keyValuePairs.forEach(({ key, value }) => {
        pipeline.setex(key, this.CACHE_TTL, JSON.stringify(value));
      });
      await pipeline.exec();
      logger.info(`Batch cache set for ${keyValuePairs.length} items`);
    } catch (error) {
      logger.error('Redis batch set error:', error);
    }
  }
}

module.exports = InventoryCache; 