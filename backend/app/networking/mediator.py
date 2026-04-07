"""
Networking Mediator
Centralized coordinator for the 1-on-1 Coffee Chat feature.
"""

from datetime import datetime, timezone
from typing import Protocol

from app.bus.message import Message, MessageType
from app.bus.message_bus import MessageBus
from app.networking.appointment_dao import AppointmentDAO
from app.networking.model.Appointment import Appointment, AppointmentStatus
from app.networking.model.Participant import AlumniAttendee, Participant, StudentAttendee


class ICoffeeChatMediator(Protocol):
    """Protocol defining the mediator interface for coffee chats."""
    
    def send_invite(self, sender: Participant, receiver_id: str, timeslot: str) -> bool:
        ...

    def respond_to_invite(self, responder: Participant, invite_id: str, accept: bool) -> bool:
        ...


class NetworkingMediator(ICoffeeChatMediator):
    """
    Concrete Mediator that enforces business logic for networking.
    Handles limit enforcement, availability checks, and event emission.
    """
    
    def __init__(self, appointment_dao: AppointmentDAO) -> None:
        self._dao = appointment_dao

    def send_invite(self, sender: Participant, receiver_id: str, timeslot: str) -> bool:
        """Centralized orchestration for sending an invitation."""
        
        # 1. Limit Check (Students are capped at 3 per day)
        if isinstance(sender, StudentAttendee):
            count = self._dao.count_by_user_and_date(sender.user_id, datetime.now(timezone.utc))
            if count >= 3:
                return False

        # 2. Availability Check (Ensure sender is free)
        sender_busy = self._dao.get_occupied_slots(sender.user_id)
        if timeslot in sender_busy:
            return False
            
        # 3. Availability Check (Ensure receiver is free)
        receiver_busy = self._dao.get_occupied_slots(receiver_id)
        if timeslot in receiver_busy:
            return False

        # 4. Persistence
        appointment = Appointment(
            sender_id=sender.user_id,
            receiver_id=receiver_id,
            timeslot=timeslot,
            status=AppointmentStatus.PENDING
        )
        saved = self._dao.insert(appointment)

        # 5. Notification via Message Bus
        if saved.id:
            MessageBus.publish(Message(
                MessageType.COFFEE_CHAT_REQUESTED,
                {
                    "sender_id": sender.user_id,
                    "receiver_id": receiver_id,
                    "timeslot": timeslot,
                    "invite_id": saved.id
                }
            ))
            return True
            
        return False

    def respond_to_invite(self, responder: Participant, invite_id: str, accept: bool) -> bool:
        """Centralized orchestration for accepting or declining an invitation."""
        
        status = AppointmentStatus.ACCEPTED if accept else AppointmentStatus.DECLINED
        updated = self._dao.update_status(invite_id, status)

        if updated:
            msg_type = MessageType.COFFEE_CHAT_ACCEPTED if accept else MessageType.COFFEE_CHAT_DECLINED
            MessageBus.publish(Message(
                msg_type,
                {
                    "invite_id": invite_id,
                    "responder_id": responder.user_id
                }
            ))
            return True

        return False
