# backend/app/accounts/schemas.py
"""
Schemas for the Accounts service.
"""
from pydantic import BaseModel


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
