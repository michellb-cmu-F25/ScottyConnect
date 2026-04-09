"""
Networking Routes
API endpoints for the 1-on-1 coffee chat and matchmaking feature.
"""

from flask import Blueprint, jsonify

from app.networking.schemas import (
    AppointmentListResponse,
    AppointmentResponse,
    BusySlotsResponse,
    CancelRequest,
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


@networking.route("/cancel", methods=["POST"])
@validate(CancelRequest)
@doc(
    request=CancelRequest,
    response=AppointmentResponse,
    description="Cancel a sent coffee chat invitation",
    tags=["networking"],
    success_status=200,
)
def cancel_invite(req: CancelRequest):
    """Endpoint to cancel a pending invitation sent by the user."""
    service = get_networking_service()
    resp = service.cancel_invite(req.invite_id, req.sender_id)
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
    data = service.get_appointments(user_id)
    return jsonify({"appointments": data, "code": 200}), 200


@networking.route("/busy-slots/<user_id>", methods=["GET"])
@doc(
    response=BusySlotsResponse,
    description="Get all occupied timeslots for a user",
    tags=["networking"],
    success_status=200,
)
def get_busy_slots(user_id: str):
    """Endpoint to retrieve a user's busy slots for conflict prevention."""
    service = get_networking_service()
    resp = service.get_busy_slots(user_id)
    return jsonify(resp.model_dump(mode="json")), resp.code
