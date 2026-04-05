# backend/app/accounts/routes.py
"""
Routes for the accounts service.
"""
from flask import Blueprint, jsonify

from app.accounts.schemas import LoginRequest, RegisterRequest, VerifyRequest
from app.accounts.service import get_account_service
from app.utils.validate import validate 

accounts = Blueprint("accounts", __name__)


@accounts.route("/register", methods=["POST"])
@validate(RegisterRequest)
def register(req: RegisterRequest):
    response = get_account_service().register(req)
    return jsonify(response.model_dump(mode="json")), response.code


@accounts.route("/verify", methods=["POST"])
@validate(VerifyRequest)
def verify(req: VerifyRequest):
    resp = get_account_service().verify(req)
    return jsonify(resp.model_dump(mode="json")), resp.code


@accounts.route("/login", methods=["POST"])
@validate(LoginRequest)
def login(req: LoginRequest):
    resp = get_account_service().login(req)
    return jsonify(resp.model_dump(mode="json")), resp.code
