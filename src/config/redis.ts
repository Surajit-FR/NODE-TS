import Redis from 'ioredis';
import { REDIS_HOST, REDIS_PORT } from './redis.config';

const redisClient = new Redis({
    port: REDIS_PORT,
    host: REDIS_HOST,
});

redisClient.on('connect', () => {
    console.log(`Connected to Redis: ${redisClient.options.host}:${redisClient.options.port}`);
});

redisClient.on('error', (err: Error) => {
    console.error('Redis error:', err);
});

export default redisClient;