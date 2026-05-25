import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from .config import settings

def hash_password(plain_text: str) -> str:
    """Hashes a plaintext pasword using the bcrypt algorithm
    
    Args:
        plain_text(str): unhashed password provided by the user.
        
    Returns:
        str: the final haashed and encoded bcrypt hash string.
        
    Raises:
        TypeError: If plain_text is not a string.
    """
    
    password_bytes = plain_text.encode('utf-8')
    salt = bcrypt.gensalt()
    
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')
    
    
def verify_password(plain_text: str, password_hash: str) -> bool:
    """Compare a plaintext password against a stored bcrypt hash

    Args:
        plain_text (str): The plaintext password provided by the user
        password_hash (str): The encoded bcrytpt hash stored in the db

    Returns:
        bool: True if passwords match, False otherwise
    """
    password_bytes = plain_text.encode('utf-8')
    hash_bytes = password_hash.encode('utf-8')
    
    return bcrypt.checkpw(password_bytes, hash_bytes)

def create_access_token(user_id: int) -> str:
    """Create and sign a JSON Web Token

    Args:
        user_id (int): The stored id of the user for whom the token is generated

    Returns:
        str: The signed, encoded JWT string
    """
    iat = datetime.now(timezone.utc)
    exp = iat + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    claims = {
        "iss" : "blood-test-tracker-api",
        "sub" : str(user_id),
        "exp" : int(exp.timestamp()),
        "iat" : int(iat.timestamp()),
    }
    
    token = jwt.encode(claims, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    
    return token


def decode_jwt_token(token: str) -> int | None:
    """Decode and validate a JWT token to retrieve the user ID.

    Args:
        token (str): The raw, encoded JWT token received from the client.

    Returns:
        int | None: The integer user ID if the token is fully valid; 
            None if the token is expired, tampered with, or malformed.
    """
    try:
        claims = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return int(claims['sub'])
    
    except (JWTError, KeyError, ValueError):
        return None
        
    
    
    