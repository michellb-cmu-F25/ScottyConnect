"""
Account Service
Handles registration, verification, and login using UserDAO for persistence.
"""

import os

from dotenv import load_dotenv

from app.accounts.model.User import User
from app.accounts.schemas import (
    LoginRequest,
    RegisterRequest,
    VerifyRequest,
    RegisterResponse,
    VerifyResponse,
    LoginResponse,
)
from app.accounts.user_dao import UserDAO
from app.utils.jwt import JWT
from app.bus.message_bus import Service, MessageBus
from app.bus.message import Message, MessageType
from app.utils.verification import generate_verification_code

load_dotenv()

ACCOUNT_SERVICE_EXTENSION_KEY = "account_service"


def get_account_service() -> "AccountService":
    from flask import current_app

    return current_app.extensions[ACCOUNT_SERVICE_EXTENSION_KEY]


"""
Account Service extends the Service base class from the message bus, utilize the message bus to publish and subscribe to messages.
"""
class AccountService(Service):
    def __init__(self, user_dao: UserDAO | None = None) -> None:
        super().__init__()
        self._users = user_dao or UserDAO()
        secret = os.getenv("JWT_SECRET")
        if not secret:
            raise ValueError("JWT_SECRET is not set")
        self._tokens = JWT(secret_key=secret)

    def register(self, request: RegisterRequest) -> RegisterResponse:
        # Check if passwords match
        if request.password != request.confirm_password:
            return RegisterResponse(message="Passwords do not match", user=None, code=400)

        # Create user
        user = User(
            username=request.username,
            email=request.email,
            password=request.password,
            verification_code=generate_verification_code(),
        )
        
        # Insert user
        try:
            saved = self._users.insert(user)
        # Return error if user already exists
        except ValueError as e:
            return RegisterResponse(message=str(e), user=None, code=400)
        
        # Publish message
        MessageBus.publish(Message(MessageType.REGISTER_MESSAGE, saved.model_dump()))
        return RegisterResponse(message="Success", user=saved, code=201)

    def verify(self, request: VerifyRequest) -> VerifyResponse:
        # Find user by email
        user = self._users.find_by_email(request.email)
        
        # Check if user exists
        if user is None:
            return VerifyResponse(message="User not found", user=None, code=404)
        
        # Check if verification code is correct
        if user.verification_code != request.code:
            return VerifyResponse(message="Invalid verification code", user=None, code=401)
        
        # Set user as verified
        self._users.set_verified(request.email, True)
        
        # Return response
        return VerifyResponse(message="Success", user=user.model_copy(update={"verified": True}), code=200)

    def login(self, request: LoginRequest) -> LoginResponse:
        # Find user by username
        user = self._users.find_by_username(request.username)
        
        # Check if user exists
        if user is None:
            return LoginResponse(message="Invalid credentials", user=None, token=None, code=401)
        
        # Check if password is correct
        if user.password != request.password:
            return LoginResponse(message="Invalid credentials", user=None, token=None, code=401)
        
        # Check if user is verified
        if not user.verified:
            return LoginResponse(message="Account not verified", user=None, token=None, code=401)
        
        # Generate token
        token = self._tokens.generate_token(user.id)
        
        # Return response
        return LoginResponse(message="Success", user=user, token=token, code=200)
