"""
Networking Service
Service layer for managing 1-on-1 coffee chat orchestration.
"""

from typing import Optional

from app.accounts.service import get_account_service
from app.networking.appointment_dao import AppointmentDAO
from app.networking.mediator import NetworkingMediator
from app.networking.model.Participant import AlumniAttendee, StudentAttendee
from app.networking.schemas import AppointmentResponse, InviteRequest, RespondRequest


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
        # 1. Resolve sender
        user_service = get_account_service()
        sender_user = user_service._users.find_by_id(req.sender_id)
        if not sender_user:
            return AppointmentResponse(message="Sender not found", code=404)
        
        # 2. Map to domain participant
        if sender_user.role == "STUDENT":
            participant = StudentAttendee(
                user_id=sender_user.id, 
                username=sender_user.username,
                availability=["9:00 AM", "10:00 AM", "2:00 PM"]
            )
        else:
            participant = AlumniAttendee(
                user_id=sender_user.id, 
                username=sender_user.username,
                availability=["9:00 AM", "10:00 AM", "2:00 PM", "4:00 PM"]
            )
        
        participant.set_mediator(self._mediator)
        
        # 3. Execute interaction
        success = participant.send_invite(req.receiver_id, req.timeslot)
        if success:
            return AppointmentResponse(message="Invitation sent successfully", code=201)
        
        return AppointmentResponse(
            message="Failed to send invitation. Check limits or availability.", 
            code=400
        )

    def respond_to_invite(self, req: RespondRequest) -> AppointmentResponse:
        """Resolves responder and uses the mediator to update invitation status."""
        user_service = get_account_service()
        responder_user = user_service._users.find_by_id(req.responder_id)
        if not responder_user:
             return AppointmentResponse(message="Responder not found", code=404)

        if responder_user.role == "STUDENT":
            participant = StudentAttendee(user_id=responder_user.id, username=responder_user.username)
        else:
            participant = AlumniAttendee(user_id=responder_user.id, username=responder_user.username)
        
        participant.set_mediator(self._mediator)
        
        success = self._mediator.respond_to_invite(participant, req.invite_id, req.accept)
        if success:
            status = "accepted" if req.accept else "declined"
            return AppointmentResponse(message=f"Invitation {status} successfully", code=200)

        return AppointmentResponse(message="Failed to respond to invitation", code=400)

    def get_appointments(self, user_id: str):
        """Fetches all appointments for a given user."""
        return self._dao.find_all_by_user(user_id)


# Global service instance getter
_networking_service: Optional[NetworkingService] = None


def get_networking_service() -> NetworkingService:
    """Provides a singleton instance of the NetworkingService."""
    global _networking_service
    if _networking_service is None:
        _networking_service = NetworkingService()
    return _networking_service
