import Redis from 'ioredis';

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
});

export const STREAM_NAME = 'signals:stream';

export async function pushToStream(signal: any) {
    await redis.xadd(STREAM_NAME, '*', 'payload', JSON.stringify(signal));
}

export default redis;
