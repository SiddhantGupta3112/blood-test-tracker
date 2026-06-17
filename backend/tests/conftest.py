from dotenv import load_dotenv
load_dotenv("tests/.env.test", override=True) 

import os
import pytest
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from app.models.base import Base
from app.api.deps import get_db
from app.main import app
from fastapi.testclient import TestClient
from app.limiter.dependency import RateLimiter
import redis as sync_redis
import asyncio
from app.limiter.redis_client import redis_client




db_url = os.getenv("DATABASE_URL")
if not db_url:
    raise ValueError("DATABASE_URL environment variable is not set.")

test_engine = create_engine(
    db_url,
    pool_size=5, max_overflow=10,
    pool_pre_ping=True
    )   

TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)   

@pytest.fixture(scope="function", autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    
@pytest.fixture(scope="function")
def client():
    def override_get_db():
        session = TestSessionLocal()
        try:
            yield session
        finally:
            session.close()
        
    with TestClient(app) as test_client:
        app.dependency_overrides[get_db] = override_get_db
        yield test_client
        app.dependency_overrides.clear()
        
@pytest.fixture(scope="function", autouse=True)
def flush_test_redis():
    client = sync_redis.Redis(
        host=os.getenv("REDIS_HOST"),
        port=int(os.getenv("REDIS_PORT")),
        db=int(os.getenv("REDIS_DB")),
        password=os.getenv("REDIS_PASSWORD"),
    )
    client.flushdb()
    yield
    client.flushdb()
    
@pytest.fixture(scope="function", autouse=True)
def reset_async_redis_pool():
    yield
    try:
        asyncio.run(redis_client.connection_pool.disconnect())
    except RuntimeError:
        pass
