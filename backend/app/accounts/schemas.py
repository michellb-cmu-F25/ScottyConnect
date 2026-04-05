# backend/app/accounts/schemas.py
"""
Schemas for the Accounts service.
"""
from pydantic import BaseModel

from app.accounts.model.User import User


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    confirm_password: str


class VerifyRequest(BaseModel):
    email: str
    code: str


class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterResponse(BaseModel):
    message: str
    user: User | None
    code: int

class VerifyResponse(BaseModel):
    message: str
    user: User | None
    code: int

class LoginResponse(BaseModel):
    message: str
    user: User | None
    token: str | None 
    code: int

