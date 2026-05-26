from app.db import SessionLocal
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core import decode_jwt_token 
from sqlalchemy.orm import Session
from app.models import User
from app.crud import fetch_user_by_user_id

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_db():
    """Provide a transactional database context dependency.

    Yields:
        Session: An active SQLAlchemy database session.
    """
    
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
            
            
def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
) -> User:
    user_id = decode_jwt_token(token)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user = fetch_user_by_user_id(db, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    return user