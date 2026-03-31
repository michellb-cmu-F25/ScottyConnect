from flask import Blueprint, jsonify

main = Blueprint("main", __name__)

@main.route("/api/health")
def health():
    return jsonify({"message": "ok"})

# Subroutes for each service
from app.accounts.routes import accounts
main.register_blueprint(accounts)

# TODO: Add subroutes for each service here.