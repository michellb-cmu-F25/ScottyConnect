"""
Networking Service
Service layer for managing 1-on-1 coffee chat orchestration.
"""

from typing import Optional

from app.accounts.service import get_account_service
from app.networking.appointment_dao import AppointmentDAO
from app.networking.mediator import NetworkingMediator
from app.networking.model.Appointment import AppointmentStatus
from app.networking.model.Participant import ParticipantFactory
from app.networking.schemas import (
    AppointmentResponse,
    BusySlotsResponse,
    InviteRequest,
    RespondRequest,
)


class NetworkingService:
    """
    Service responsible for coordinating coffee chat interactions.
    Encapsulates role discovery, mediator injection, and persistence.
    """
    
    def __init__(self, dao: Optional[AppointmentDAO] = None) -> None:
        self._dao = dao or AppointmentDAO()
        self._mediator = NetworkingMediator(self._dao)

    def send_invite(self, req: InviteRequest) -> AppointmentResponse:
        """Resolves roles and uses the mediator to send an invitation."""
        # 1. Resolve sender and receiver
        user_service = get_account_service()
        sender_user = user_service._users.find_by_id(req.sender_id)
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
        
        # 3. Execute interaction (IDs only, names resolved on fetch)
        success = self._mediator.send_invite(
            sender=participant,
            receiver_id=req.receiver_id,
            timeslot=req.timeslot
        )
        
        if success:
            return AppointmentResponse(message="Invitation sent successfully", code=201)
        
        return AppointmentResponse(
            message="Failed to send invitation. Check limits or availability.", 
            code=400
        )

    def cancel_invite(self, appointment_id: str, sender_id: str) -> AppointmentResponse:
        """Allows a sender to cancel a pending invitation."""
        appt = self._dao.find_by_id(appointment_id)
        if not appt:
            return AppointmentResponse(message="Appointment not found", code=404)
        
        if appt.sender_id != sender_id:
            return AppointmentResponse(message="Unauthorized to cancel this invitation", code=403)
        
        if appt.status != AppointmentStatus.PENDING:
            return AppointmentResponse(message=f"Cannot cancel invitation in {appt.status} status", code=400)
        
        success = self._dao.update_status(appointment_id, AppointmentStatus.CANCELLED)
        if success:
             return AppointmentResponse(message="Invitation cancelled successfully", code=200)
        
        return AppointmentResponse(message="Failed to cancel invitation", code=400)

    def respond_to_invite(self, req: RespondRequest) -> AppointmentResponse:
        """Resolves responder and uses the mediator to update invitation status."""
        user_service = get_account_service()
        responder_user = user_service._users.find_by_id(req.responder_id)
        if not responder_user:
             return AppointmentResponse(message="Responder not found", code=404)

        # Use Factory for responder as well
        participant = ParticipantFactory.create(
            user_id=responder_user.id,
            username=responder_user.username,
            role=responder_user.role
        )
        participant.set_mediator(self._mediator)
        
        success = self._mediator.respond_to_invite(participant, req.invite_id, req.accept)
        if success:
            status = "accepted" if req.accept else "declined"
            return AppointmentResponse(message=f"Invitation {status} successfully", code=200)

        return AppointmentResponse(message="Failed to respond to invitation", code=400)

    def get_appointments(self, user_id: str):
        """Fetches all appointments for a given user and resolves handles."""
        appts = self._dao.find_all_by_user(user_id)
        user_service = get_account_service()
        
        results = []
        for a in appts:
            # Resolve participant handles
            sender = user_service._users.find_by_id(a.sender_id)
            receiver = user_service._users.find_by_id(a.receiver_id)
            
            # Convert to dict and inject current names
            data = a.model_dump(mode="json")
            data["sender_name"] = sender.username if sender else "Unknown User"
            data["receiver_name"] = receiver.username if receiver else "Unknown User"
            results.append(data)
            
        return results

    def get_busy_slots(self, user_id: str) -> BusySlotsResponse:
        """Returns a list of all occupied timeslots for a user."""
        slots = self._dao.get_occupied_slots(user_id)
        return BusySlotsResponse(busy_slots=slots, code=200)


# Global service instance getter
_networking_service: Optional[NetworkingService] = None


def get_networking_service() -> NetworkingService:
    """Provides a singleton instance of the NetworkingService."""
    global _networking_service
    if _networking_service is None:
        _networking_service = NetworkingService()
    return _networking_service
