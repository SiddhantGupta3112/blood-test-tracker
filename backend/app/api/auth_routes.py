from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas import Login, TokenResponse, Register, UserResponse
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models import User
from app.crud import fetch_user_by_email, create_new_user
from app.core import verify_password, create_access_token
from sqlalchemy.exc import IntegrityError

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(user_data: Login, db: Session = Depends(get_db)):
    user = fetch_user_by_email(db, user_data.email)
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"}
        )
          
    return TokenResponse(
        access_token=create_access_token(user.user_id)
    )

@router.post("/register" , response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: Register, db: Session = Depends(get_db)):
    
    try:
        user = create_new_user(db, user_data)
        return user
        
    except IntegrityError as e:
        db.rollback()
        
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )
    
@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def me(current_user: User = Depends(get_current_user)):
        return current_user
    