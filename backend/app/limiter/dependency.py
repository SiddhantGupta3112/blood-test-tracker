from fastapi import Request, HTTPException, status
from app.limiter.core import is_rate_limited
from app.limiter.redis_client import get_redis
from app.core.security import decode_jwt_token

def get_user_key(request: Request) -> str:
    auth_header = request.headers.get("Authorization", "")
    
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        user_id = decode_jwt_token(token)
        if user_id:
            return f"rate_limit:user:{user_id}:{request.url.path}"
        
    if not request.client:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Could not determine client network connection"
        )
        
    return f"rate_limit:ip:{request.client.host}:{request.url.path}"

def RateLimiter(limit: int, window_seconds: int, key_func=None):
    async def dependency(request: Request):
        if key_func:
            key = key_func(request)
        else:
            if not request.client:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="Could not determine client network connection"
                )
                
            ip = request.client.host
            
            key = f"rate_limit:{ip}:{request.url.path}"
            
        redis_client = get_redis()
        limited = await is_rate_limited(redis_client, key, limit, window_seconds)
        
        if limited:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS, 
                detail="Too many requests"
            )
            
    return dependency
    
    