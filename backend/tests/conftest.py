from dotenv import load_dotenv
load_dotenv("tests/.env.test", override=True) 

import os # noqa: E402
import pytest # noqa: E402
from sqlalchemy.orm import sessionmaker # noqa: E402
from sqlalchemy import create_engine # noqa: E402
from app.models.base import Base # noqa: E402
from app.api.deps import get_db # noqa: E402
from app.main import app # noqa: E402
from fastapi.testclient import TestClient # noqa: E402
#from app.limiter.dependency import RateLimiter # noqa: E402
import redis as sync_redis # noqa: E402
import asyncio # noqa: E402
from app.limiter.redis_client import redis_client # noqa: E402




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
    
    redis_host = os.getenv("REDIS_HOST")
    redis_port_str = os.getenv("REDIS_PORT")
    redis_db_str = os.getenv("REDIS_DB")
    redis_password = os.getenv("REDIS_PASSWORD")
    if not redis_host:
        raise ValueError("REDIS_HOST environment variable is not set.")
    if not redis_port_str:
        raise ValueError("REDIS_PORT environment variable is not set.")
    if not redis_db_str:
        raise ValueError("REDIS_DB environment variable is not set.")
    client = sync_redis.Redis(
        host=redis_host,
        port=int(redis_port_str),
        db=int(redis_db_str),
        password=redis_password,
    )
    client.flushdb()
    yield
    client.flushdb()
    
@pytest.fixture(scope="function", autouse=True)
def reset_async_redis_pool():
    yield
    try:
        disconnect_coro = redis_client.connection_pool.disconnect()
        
        if disconnect_coro is not None:
            asyncio.run(disconnect_coro)
    except RuntimeError:
        pass
