from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth_routes import router as auth_router
from app.api.pdf_routes import router as pdf_router

app = FastAPI()


origins = [
    "http://localhost:5173",  
    "http://localhost:3000",  
    "http://127.0.0.1:5173",
]

# 2. Add the Middleware to the app
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            # Allows specific origins
    allow_credentials=True,
    allow_methods=["*"],              # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],              # Allows all headers
)

# Include your routers
app.include_router(auth_router)
app.include_router(pdf_router)

@app.get("/")
def root():
    return {"status": "Backend is running with CORS enabled"}