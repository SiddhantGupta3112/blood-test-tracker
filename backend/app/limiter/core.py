import redis.asyncio as aioredis
import time

async def  is_rate_limited(redis_client: aioredis.Redis, key: str, limit: int, window_seconds: int) -> bool:
    clear = int(time.time() * 1000) - (window_seconds * 1000)
    
    await redis_client.zremrangebyscore(key, 0, clear)
    
    now = int(time.time() * 1000)
    await redis_client.zadd(key, {str(now): now})
    
    total_requests = await redis_client.zcard(key)
    
    await redis_client.expire(key, window_seconds)
    
    return total_requests > limit
