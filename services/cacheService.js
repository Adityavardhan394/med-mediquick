const Redis = require('ioredis');
const logger = require('./logger');

class CacheService {
    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });

        this.redis.on('error', (error) => {
            logger.error('Redis connection error:', error);
        });

        this.redis.on('connect', () => {
            logger.info('Connected to Redis');
        });
    }

    async getInventory(key) {
        try {
            const cachedData = await this.redis.get(key);
            return cachedData ? JSON.parse(cachedData) : null;
        } catch (error) {
            logger.error('Redis get error:', error);
            return null;
        }
    }

    async setInventory(key, data, expirySeconds = 300) {
        try {
            await this.redis.setex(key, expirySeconds, JSON.stringify(data));
        } catch (error) {
            logger.error('Redis set error:', error);
        }
    }

    async invalidateInventory(key) {
        try {
            await this.redis.del(key);
        } catch (error) {
            logger.error('Redis delete error:', error);
        }
    }

    generateInventoryKey(medicineId, lat, lng, radius) {
        return `inventory:${medicineId}:${lat}:${lng}:${radius}`;
    }

    async getInventoryNearby(lat, lng, radius) {
        const key = `inventory:nearby:${lat}:${lng}:${radius}`;
        return this.getInventory(key);
    }

    async setInventoryNearby(lat, lng, radius, data) {
        const key = `inventory:nearby:${lat}:${lng}:${radius}`;
        await this.setInventory(key, data);
    }
}

module.exports = new CacheService(); 