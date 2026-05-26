from app.models import User
from app.schemas import Register
from app.core import hash_password
from sqlalchemy.orm import Session

def fetch_user_by_email(db: Session, email: str) -> User | None:
    """Fetch a user by a provided email

    Args:
        email (str): The email used to search the user

    Returns:
        User | None: User object if user with given email exists, None otherwise
    """
    
    
    user = db.query(User).filter(User.email == email).first()
        
    return user
    
    
def fetch_user_by_user_id(db: Session, user_id: int) -> User | None:
    """Fetch a user by user_id

    Args:
        user_id (int): The given user_id to search for user

    Returns:
        User | None: User object if user with given user_id exists, None otherwise
    """
    
    
    user = db.query(User).filter(User.user_id == user_id).first()
    
        
    return user
    
    
def create_new_user(db: Session, user_data: Register) -> User:
    """Create a new user

    Args:
        user_data (Register): Pydantic model object used for validation

    Returns:
        User: returns the new User object if user created
    """
    
    user_dict = user_data.model_dump()
    
    user_dict["password_hash"] = hash_password(user_dict.pop("password"))
    
    db_user = User(**user_dict)
    
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user