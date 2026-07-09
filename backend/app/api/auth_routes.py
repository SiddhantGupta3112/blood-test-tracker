from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas import Login, TokenResponse, Register, UserResponse
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models import User
from app.crud import fetch_user_by_email, create_new_user
from app.core import verify_password, create_access_token
from sqlalchemy.exc import IntegrityError

from app.limiter.dependency import RateLimiter

from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter(prefix="/auth", tags=["auth"])

def _authenticate_user(db: Session, email: str, password: str):
    user = fetch_user_by_email(db, email)

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
    
@router.post("/swagger-login", response_model=TokenResponse, include_in_schema=False)
def swagger_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = _authenticate_user(db, form_data.username, form_data.password)

    return TokenResponse(
        access_token=create_access_token(user.user_id)
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    dependencies=[Depends(RateLimiter(5, 60))]
)
def login(user_data: Login, db: Session = Depends(get_db)):
    user = _authenticate_user(db, user_data.email, user_data.password)

    return TokenResponse(
        access_token=create_access_token(user.user_id)
    )
    
@router.post("/register" , response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: Register, db: Session = Depends(get_db)):
    
    try:
        user = create_new_user(db, user_data)
        return user
        
    except IntegrityError:
        db.rollback()
        
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )
    
@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def me(current_user: User = Depends(get_current_user)):
        return current_user
    
@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(user)
    db.commit()