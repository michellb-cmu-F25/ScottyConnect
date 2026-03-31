# backend/app/accounts/routes.py
"""
Routes for the accounts service.
"""
from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from app.accounts.schemas import LoginRequest, RegisterRequest, VerifyRequest
from app.accounts.service import get_account_service

accounts = Blueprint("accounts", __name__)


def _public_user(user):
    return user.model_dump(
        exclude={"password", "verification_code"},
        mode="json",
    )


def _json_body():
    if not request.is_json:
        return None
    return request.get_json(silent=True)


@accounts.route("/api/accounts/register", methods=["POST"])
def register():
    data = _json_body()
    if data is None:
        return jsonify({"message": "JSON body required"}), 400
    try:
        req = RegisterRequest.model_validate(data)
    except ValidationError as e:
        return jsonify({"errors": e.errors()}), 400

    try:
        user, status = get_account_service().register(req)
    except ValueError as e:
        return jsonify({"message": str(e)}), 400

    return jsonify({"message": "Account registered", "user": _public_user(user)}), status


@accounts.route("/api/accounts/verify", methods=["POST"])
def verify():
    data = _json_body()
    if data is None:
        return jsonify({"message": "JSON body required"}), 400
    try:
        req = VerifyRequest.model_validate(data)
    except ValidationError as e:
        return jsonify({"errors": e.errors()}), 400

    user, status = get_account_service().verify(req)
    if user is None:
        return jsonify({"message": "Verification failed"}), status

    return jsonify({"message": "Account verified", "user": _public_user(user)}), status


@accounts.route("/api/accounts/login", methods=["POST"])
def login():
    data = _json_body()
    if data is None:
        return jsonify({"message": "JSON body required"}), 400
    try:
        req = LoginRequest.model_validate(data)
    except ValidationError as e:
        return jsonify({"errors": e.errors()}), 400

    user, status, token = get_account_service().login(req)
    if user is None or token is None:
        if status == 500:
            return jsonify({"message": "Server error"}), 500
        return jsonify({"message": "Invalid credentials"}), status

    return (
        jsonify(
            {
                "message": "Logged in",
                "user": _public_user(user),
                "token": token,
            }
        ),
        status,
    )
