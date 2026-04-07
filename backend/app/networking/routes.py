"""
Networking Routes
API endpoints for the 1-on-1 coffee chat and matchmaking feature.
"""

from flask import Blueprint, jsonify

from app.networking.schemas import (
    AppointmentListResponse,
    AppointmentResponse,
    InviteRequest,
    RespondRequest,
)
from app.networking.service import get_networking_service
from app.utils.doc import doc
from app.utils.validate import validate

networking = Blueprint("networking", __name__)


@networking.route("/invite", methods=["POST"])
@validate(InviteRequest)
@doc(
    request=InviteRequest,
    response=AppointmentResponse,
    description="Send a 1-on-1 coffee chat invitation",
    tags=["networking"],
    success_status=201,
)
def send_invite(req: InviteRequest):
    """Endpoint to initiate a coffee chat request."""
    service = get_networking_service()
    resp = service.send_invite(req)
    return jsonify(resp.model_dump(mode="json")), resp.code


@networking.route("/respond", methods=["POST"])
@validate(RespondRequest)
@doc(
    request=RespondRequest,
    response=AppointmentResponse,
    description="Respond (Accept/Decline) to a coffee chat invitation",
    tags=["networking"],
    success_status=200,
)
def respond_invite(req: RespondRequest):
    """Endpoint to accept or decline a pending invitation."""
    service = get_networking_service()
    resp = service.respond_to_invite(req)
    return jsonify(resp.model_dump(mode="json")), resp.code


@networking.route("/appointments/<user_id>", methods=["GET"])
@doc(
    response=AppointmentListResponse,
    description="Get all coffee chat appointments for a user",
    tags=["networking"],
    success_status=200,
)
def get_appointments(user_id: str):
    """Endpoint to retrieve the appointment history for a user."""
    service = get_networking_service()
    appointments = service.get_appointments(user_id)
    # Wrap in list of dicts for serialization
    data = [a.model_dump(mode="json") for a in appointments]
    return jsonify({"appointments": data, "code": 200}), 200
