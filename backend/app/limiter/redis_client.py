import redis.asyncio as aioredis
from app.core.config import settings

REDIS_URL = f"redis://:{settings.REDIS_PASSWORD}@{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"

redis_client: aioredis.Redis = aioredis.from_url(
    REDIS_URL,
    decode_responses=True
)

def get_redis() -> aioredis.Redis:
    return redis_client