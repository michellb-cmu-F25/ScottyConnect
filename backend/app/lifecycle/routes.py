# backend/app/lifecycle/routes.py
"""
Routes for the lifecycle service.
"""
from flask import Blueprint, jsonify

from app.lifecycle.schemas import (
    TransitionRequest,
    EventResponse,
)
from app.lifecycle.service import get_lifecycle_service
from app.utils.doc import doc
from app.utils.validate import validate

lifecycle = Blueprint("lifecycle", __name__)


# Decorator order convention: @route -> @validate -> @doc
@lifecycle.route("/events/<event_id>", methods=["GET"])
@doc(
    response=EventResponse,
    description="Get a single event by ID",
    tags=["lifecycle"],
    success_status=200,
)
def get_event(event_id: str):
    resp = get_lifecycle_service().get_event(event_id)
    return jsonify(resp.model_dump(mode="json")), resp.code


@lifecycle.route("/events/<event_id>/transition", methods=["POST"])
@validate(TransitionRequest)
@doc(
    request=TransitionRequest,
    response=EventResponse,
    description="Transition an event to a new lifecycle state",
    tags=["lifecycle"],
    success_status=200,
)
def transition_event(req: TransitionRequest, event_id: str):
    # TODO: Replace with authenticated user ID once auth middleware is implemented
    requester_id = "TODO_OWNER_ID"
    resp = get_lifecycle_service().transition(event_id, req.target_status, requester_id)
    return jsonify(resp.model_dump(mode="json")), resp.code
