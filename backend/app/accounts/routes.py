# backend/app/accounts/routes.py
"""
Routes for the accounts service.
"""
from flask import Blueprint, jsonify

from app.accounts.schemas import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    VerifyRequest,
    VerifyResponse,
)
from app.accounts.service import get_account_service
from app.utils.doc import doc
from app.utils.validate import validate

accounts = Blueprint("accounts", __name__)


# Decorator order convention: @route -> @validate -> @doc
@accounts.route("/register", methods=["POST"])
@validate(RegisterRequest)
@doc(
    request=RegisterRequest,
    response=RegisterResponse,
    description="Register a new user account",
    tags=["accounts"],
    success_status=201,
)
def register(req: RegisterRequest):
    response = get_account_service().register(req)
    return jsonify(response.model_dump(mode="json")), response.code


@accounts.route("/verify", methods=["POST"])
@validate(VerifyRequest)
@doc(
    request=VerifyRequest,
    response=VerifyResponse,
    description="Verify a user account with email code",
    tags=["accounts"],
    success_status=200,
)
def verify(req: VerifyRequest):
    resp = get_account_service().verify(req)
    return jsonify(resp.model_dump(mode="json")), resp.code


@accounts.route("/login", methods=["POST"])
@validate(LoginRequest)
@doc(
    request=LoginRequest,
    response=LoginResponse,
    description="Authenticate a user account",
    tags=["accounts"],
    success_status=200,
)
def login(req: LoginRequest):
    resp = get_account_service().login(req)
    return jsonify(resp.model_dump(mode="json")), resp.code
