"""
Account Service
Handles registration, verification, and login using UserDAO for persistence.
"""

import os
import secrets

from dotenv import load_dotenv

from app.accounts.Models.User import User
from app.accounts.schemas import LoginRequest, RegisterRequest, VerifyRequest
from app.accounts.user_dao import UserDAO
from app.utils.jwt import JWT
from app.bus.message_bus import Service
from app.bus.message import MessageType

load_dotenv()

EXTENSION_KEY = "account_service"


def get_account_service() -> "AccountService":
    from flask import current_app

    return current_app.extensions[EXTENSION_KEY]


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

    def register(self, request: RegisterRequest) -> tuple[User, int]:
        if request.password != request.confirm_password:
            raise ValueError("Passwords do not match")
        user = User(
            username=request.username,
            email=request.email,
            password=request.password,
            verification_code=secrets.token_urlsafe(16),
        )
        saved = self._users.insert(user)
        MessageBus.publish(Message(MessageType.ACCOUNT_MESSAGE, saved.model_dump()))
        return saved, 201

    def verify(self, request: VerifyRequest) -> tuple[User | None, int]:
        user = self._users.find_by_email(request.email)
        if user is None:
            return None, 404
        if user.verification_code != request.code:
            return None, 401
        self._users.set_verified(request.email, True)
        return user.model_copy(update={"verified": True}), 200

    def login(self, request: LoginRequest) -> tuple[User | None, int, str | None]:
        user = self._users.find_by_username(request.username)
        if user is None:
            return None, 401, None
        if user.password != request.password:
            return None, 401, None
        if not user.id:
            return None, 500, None
        token = self._tokens.generate_token(user.id)
        return user, 200, token
