"""
Networking Service
Service layer for managing 1-on-1 coffee chat orchestration.
"""

from datetime import datetime, timezone
from typing import Optional

from app.accounts.service import get_account_service
from app.networking.appointment_dao import AppointmentDAO
from app.networking.mediator import NetworkingMediator
from app.networking.model.Appointment import AppointmentStatus
from app.networking.model.Participant import ParticipantFactory
from app.networking.policies.policy_factory import InvitePolicyFactory
from app.networking.schemas import (
    AppointmentResponse,
    BusySlotsResponse,
    InviteRequest,
    RespondRequest,
)

NETWORKING_SERVICE_EXTENSION_KEY = "networking_service"


class NetworkingService:
    """
    Service responsible for coordinating coffee chat interactions.
    Encapsulates role discovery, mediator injection, and persistence.
    """
    
    def __init__(self, dao: Optional[AppointmentDAO] = None) -> None:
        self._dao = dao or AppointmentDAO()
        self._mediator = NetworkingMediator(self._dao)
        self._invite_policy_factory = InvitePolicyFactory()
        self.key = NETWORKING_SERVICE_EXTENSION_KEY

    # Preserve booked wall-clock time by stripping timezone info.
    @staticmethod
    def _wall_clock_datetime(value: datetime) -> datetime:
        return value.replace(tzinfo=None) if value.tzinfo is not None else value

    # Resolves roles and uses the mediator to send an invitation.
    def request_invite(self, req: InviteRequest, sender_id: str) -> AppointmentResponse:
        # 1. Resolve sender and receiver
        user_service = get_account_service()
        sender_user = user_service._users.find_by_id(sender_id)
        if not sender_user:
            return AppointmentResponse(message="Sender not found", code=404)
        
        receiver_user = user_service._users.find_by_id(req.receiver_id)
        if not receiver_user:
            return AppointmentResponse(message="Receiver not found", code=404)
        
        # 2. Map to domain participant using Factory (SOLID: OCP/SRP)
        participant = ParticipantFactory.create(
            user_id=sender_user.id,
            username=sender_user.username,
            role=sender_user.role
        )
        participant.set_mediator(self._mediator)
        scheduled_at = self._wall_clock_datetime(req.scheduled_at)

        # Return policy-specific reason (e.g. student alumni cap) instead of a generic failure.
        policy = self._invite_policy_factory.for_role(sender_user.role)
        allowed, reason = policy.can_send_invite(
            sender_id=sender_user.id,
            receiver_role=receiver_user.role,
            receiver_id=req.receiver_id,
            scheduled_at=scheduled_at,
            dao=self._dao,
            now=datetime.now(timezone.utc),
        )
        if not allowed and reason:
            return AppointmentResponse(message=reason, code=400)
        
        # 3. Execute interaction (Delegated to participant -> mediator)
        success = participant.initiate_chat(
            receiver_id=req.receiver_id,
            scheduled_at=scheduled_at,
            receiver_role=receiver_user.role,
        )
        
        if success:
            return AppointmentResponse(message="Invitation sent successfully", code=201)
        
        return AppointmentResponse(
            message="Failed to send invitation. Check limits or availability.", 
            code=400
        )

    # Allows either participant to cancel a pending or accepted invitation.
    def cancel_invite(self, appointment_id: str, sender_id: str) -> AppointmentResponse:
        appt = self._dao.find_by_id(appointment_id)
        if not appt:
            return AppointmentResponse(message="Appointment not found", code=404)
        
        # 'sender_id' is the user attempting to cancel. Either party can cancel.
        if appt.sender_id != sender_id and appt.receiver_id != sender_id:
            return AppointmentResponse(message="Unauthorized to cancel this invitation", code=403)
        
        if not appt.can_transition(AppointmentStatus.CANCELLED):
            return AppointmentResponse(message=f"Cannot cancel invitation in {appt.status} status", code=400)
        
        from zoneinfo import ZoneInfo
        mv_now = datetime.now(ZoneInfo("America/Los_Angeles")).replace(tzinfo=None)
        if appt.scheduled_at < mv_now:
            return AppointmentResponse(message="Cannot cancel a past appointment", code=400)
        
        success = self._dao.update_status_atomically(
            appointment_id,
            expected_status=appt.status,
            new_status=AppointmentStatus.CANCELLED,
        )
        if success:
             return AppointmentResponse(message="Invitation cancelled successfully", code=200)

        latest = self._dao.find_by_id(appointment_id)
        if latest and latest.status != appt.status:
            return AppointmentResponse(
                message=f"Cannot cancel invitation, status changed to {latest.status}",
                code=409,
            )
        
        return AppointmentResponse(message="Failed to cancel invitation", code=400)


    # Resolves responder and uses the mediator to update invitation status.
    def process_invite_response(self, req: RespondRequest, responder_id: str) -> AppointmentResponse:
        user_service = get_account_service()
        responder_user = user_service._users.find_by_id(responder_id)
        if not responder_user:
             return AppointmentResponse(message="Responder not found", code=404)

        appt = self._dao.find_by_id(req.invite_id)
        if not appt:
            return AppointmentResponse(message="Appointment not found", code=404)

        if appt.receiver_id != responder_id:
            return AppointmentResponse(
                message="Only the invitation receiver can respond",
                code=403,
            )

        target_status = AppointmentStatus.ACCEPTED if req.accept else AppointmentStatus.DECLINED
        if not appt.can_transition(target_status):
            return AppointmentResponse(
                message=f"Cannot respond to invitation in {appt.status} status",
                code=400,
            )

        # Use Factory for responder as well
        participant = ParticipantFactory.create(
            user_id=responder_user.id,
            username=responder_user.username,
            role=responder_user.role
        )
        participant.set_mediator(self._mediator)
        
        if req.accept:
            success = participant.accept_chat(req.invite_id)
        else:
            success = participant.decline_chat(req.invite_id)

        if success:
            status = "accepted" if req.accept else "declined"
            return AppointmentResponse(message=f"Invitation {status} successfully", code=200)

        latest = self._dao.find_by_id(req.invite_id)
        if latest and latest.status != AppointmentStatus.PENDING:
            return AppointmentResponse(
                message=f"Cannot respond to invitation in {latest.status} status",
                code=409,
            )

        return AppointmentResponse(message="Failed to respond to invitation", code=400)

    # Fetches all appointments for a given user and resolves handles.
    def get_appointments(self, user_id: str):
        appts = self._dao.find_all_by_user(user_id)
        user_service = get_account_service()
        
        results = []
        user_cache = {}
        
        def get_user(uid):
            if uid not in user_cache:
                user_cache[uid] = user_service._users.find_by_id(uid)
            return user_cache[uid]

        for a in appts:
            # Resolve participant handles via local cache to prevent N+1 queries
            sender = get_user(a.sender_id)
            receiver = get_user(a.receiver_id)
            
            # Convert to dict and inject current names
            data = a.model_dump(mode="json")
            data["sender_name"] = sender.username if sender else "Unknown User"
            data["receiver_name"] = receiver.username if receiver else "Unknown User"
            results.append(data)
            
        return results

    # Returns a list of all occupied timeslots for a user.
    def get_busy_slots(self, user_id: str) -> BusySlotsResponse:
        slots = self._dao.get_occupied_slots(user_id)
        return BusySlotsResponse(busy_slots=slots, code=200)


# Returns NetworkingService from Flask app extensions.
def get_networking_service() -> NetworkingService:
    from flask import current_app

    return current_app.extensions[NETWORKING_SERVICE_EXTENSION_KEY]
