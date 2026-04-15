"""
Routes for the recommendation service.
"""

from flask import Blueprint, jsonify, request

from app.recommendation.schemas import RecommendationResponse
from app.recommendation.service import get_recommendation_service
from app.utils.doc import doc

recommendation = Blueprint("recommendation", __name__)

DEFAULT_LIMIT = 20
MAX_LIMIT = 100


# Decorator order convention: @route -> @doc
@recommendation.route("/<user_id>", methods=["GET"])
@doc(
    response=RecommendationResponse,
    description="Get recommended published events for a user, ranked by strategy with remaining published events appended",
    tags=["recommendation"],
    success_status=200,
)
def get_recommendation(user_id: str):
    strategy = request.args.get("strategy", "").strip()
    if not strategy:
        return jsonify({"message": "'strategy' query parameter is required"}), 400

    raw_limit = request.args.get("limit", str(DEFAULT_LIMIT))
    try:
        limit = int(raw_limit)
        if limit < 1 or limit > MAX_LIMIT:
            raise ValueError
    except ValueError:
        return jsonify({"message": f"'limit' must be an integer between 1 and {MAX_LIMIT}"}), 400

    resp = get_recommendation_service().get_recommendation(user_id, strategy, limit=limit)
    return jsonify(resp.model_dump(mode="json")), resp.code
