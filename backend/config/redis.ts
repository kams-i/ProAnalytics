import { createClient } from 'redis';

const redisClient = createClient({
    url: process.env.REDIS_URL 
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Connected to Upstash Redis server'));

// Connect asynchronously and keep connection open for express app
(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('Failed to connect to Redis:', errorMessage);
    }
})();

export default redisClient;