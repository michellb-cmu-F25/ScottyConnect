from flask import Blueprint, jsonify

main = Blueprint("main", __name__)

@main.route("/api/health")
def health():
    return jsonify({"message": "ok"})

@main.route("/api/sentry-debug")
def sentry_debug():
    raise Exception("Test Sentry Error")

# Subroutes for each service
from app.accounts.routes import accounts
main.register_blueprint(accounts, url_prefix="/api/accounts")

# TODO: Add subroutes for each service here.