from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth_routes import router as auth_router
from app.api.pdf_routes import router as pdf_router
from app.api.plots_routes import router as plot_router
from app.db.seed_data import seed_test_metadata
from app.db import SessionLocal
from contextlib import asynccontextmanager
import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Detect if we are running in pytest
    if "PYTEST_CURRENT_TEST" in os.environ:
        # Import inside the function to avoid circular imports
        from tests.conftest import TestSessionLocal
        db = TestSessionLocal()
    else:
        db = SessionLocal()

    try:
        seed_test_metadata(db)
    finally:
        db.close()
    yield
    
    
app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:5173",  
    "http://localhost:3000",  
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            # Allows specific origins
    allow_credentials=True,
    allow_methods=["*"],              # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],              # Allows all headers
)



app.include_router(auth_router)
app.include_router(pdf_router)
app.include_router(plot_router)

@app.get("/")
def root():
    return {"status": "Backend is running with CORS enabled"}