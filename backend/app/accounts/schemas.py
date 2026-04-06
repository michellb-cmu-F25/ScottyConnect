# backend/app/accounts/schemas.py
"""
Schemas for the Accounts service.
"""
from datetime import datetime

from pydantic import BaseModel


# Register request schema
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    confirm_password: str

# Verify request schema
class VerifyRequest(BaseModel):
    email: str
    code: str

# Login request schema
class LoginRequest(BaseModel):
    username: str
    password: str


# Public user schema (used for response, hide sensitive information)
class PublicUser(BaseModel):
    id: str | None
    username: str
    email: str
    verified: bool
    created_at: datetime
    updated_at: datetime

# Register response schema
class RegisterResponse(BaseModel):
    message: str
    user: PublicUser | None
    code: int

# Verify response schema
class VerifyResponse(BaseModel):
    message: str
    user: PublicUser | None
    token: str | None
    code: int

# Login response schema
class LoginResponse(BaseModel):
    message: str
    user: PublicUser | None
    token: str | None 
    code: int

