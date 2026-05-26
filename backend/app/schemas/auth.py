from pydantic import AfterValidator, BaseModel
from typing import Optional, Annotated
import re
from datetime import date


def email_validator(email : str) -> str:
    """Validate a given email
    
    For Email to be valid must match the regex expression
    
    Args:
        email (str): The email provided to the function

    Returns:
        bool: True is email is valid, False otherwise
    """
    
    REGEX = r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}"
    
    if not re.fullmatch(REGEX,email):
        raise ValueError("Invalid Email")
    return email


def passwrd_validator(password: str) -> str:
    """Check if input password is valid or not

    Args:
        password (str): The input password

    Returns:
        bool: True if password valid, false otherwise
    """
    
    PASSWORD_REGEX = re.compile(
        r"""^(?=.*[A-Z])(?=.*\d)(?=.*[@_!#$%^&*()\-+={}\[\]|\\:;"'<>,.?/~`]).{8,}$"""
    )
    
    if not re.fullmatch(PASSWORD_REGEX, password):
        raise ValueError("Invalid Password")

    return password

class Register(BaseModel):
    email: Annotated[str, AfterValidator(email_validator)]
    password: Annotated[str, AfterValidator(passwrd_validator)]
    full_name: str
    phone_country_code : Optional[str]
    phone_number: Optional[str]
    date_of_birth: Optional[date]
    
class Login(BaseModel):
    email: Annotated[str, AfterValidator(email_validator)]
    password: Annotated[str, AfterValidator(passwrd_validator)]
    
class Token_response(BaseModel):
    token: str
    token_type: str = "bearer"
    
class UserResponse(BaseModel):
    user_id: int
    full_name: str
    email: str
    date_of_birth: Optional[date] = None

    model_config = {"from_attributes": True}

