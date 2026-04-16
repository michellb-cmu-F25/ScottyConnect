"""
Networking Mediator
Centralized coordinator for the 1-on-1 Coffee Chat feature.
"""

from datetime import datetime, timezone
from typing import Protocol

from app.bus.message import MessageType, Message
from app.bus.message_bus import MessageBus
from app.networking.appointment_dao import AppointmentDAO
from app.networking.model.Appointment import Appointment, AppointmentStatus
from app.networking.model.Participant import Participant
from app.networking.policies.policy_factory import InvitePolicyFactory


class ICoffeeChatMediator(Protocol):
    # Protocol defining the mediator interface for coffee chats.
    
    def dispatch_invite(
        self,
        sender: Participant,
        receiver_id: str,
        scheduled_at: datetime,
        receiver_role: str,
    ) -> bool:
        ...

    def finalize_invite_response(self, responder: Participant, invite_id: str, accept: bool) -> bool:
        ...

    def validate_availability(self, user_id: str, scheduled_at: datetime) -> bool:
        ...


class NetworkingMediator(ICoffeeChatMediator):
    """
    Concrete Mediator that enforces business logic for networking.
    Handles limit enforcement, availability checks, and event emission.
    """
    
    def __init__(
        self,
        appointment_dao: AppointmentDAO,
        invite_policy_factory: InvitePolicyFactory | None = None,
    ) -> None:
        self._dao = appointment_dao
        self._invite_policy_factory = invite_policy_factory or InvitePolicyFactory()

    # Centralized orchestration for sending an invitation.
    def dispatch_invite(
        self,
        sender: Participant,
        receiver_id: str,
        scheduled_at: datetime,
        receiver_role: str,
    ) -> bool:

        # 1. Role-specific policy check
        policy = self._invite_policy_factory.for_role(sender.get_role())
        allowed, _ = policy.can_send_invite(
            sender_id=sender.user_id,
            receiver_role=receiver_role,
            receiver_id=receiver_id,
            scheduled_at=scheduled_at,
            dao=self._dao,
            now=datetime.now(timezone.utc),
        )
        if not allowed:
            return False

        # 2. Availability Check (Ensure sender is free)
        if not self.validate_availability(sender.user_id, scheduled_at):
            return False
            
        # 3. Availability Check (Ensure receiver is free)
        if not self.validate_availability(receiver_id, scheduled_at):
            return False

        # 4. Persistence
        appointment = Appointment(
            sender_id=sender.user_id,
            receiver_id=receiver_id,
            sender_role=sender.get_role(),
            receiver_role=receiver_role.upper(),
            scheduled_at=scheduled_at,
            status=AppointmentStatus.PENDING
        )
        saved = self._dao.insert(appointment)

        # 5. Notification via Message Bus
        if saved.id:
            msg = Message(
                MessageType.COFFEE_CHAT_REQUESTED,
                {
                    "sender_id": sender.user_id,
                    "receiver_id": receiver_id,
                    "invite_id": saved.id
                }
            )
            MessageBus.publish(msg)
            return True
            
        return False

    # Centralized orchestration for accepting or declining an invitation.
    def finalize_invite_response(self, responder: Participant, invite_id: str, accept: bool) -> bool:
        
        status = AppointmentStatus.ACCEPTED if accept else AppointmentStatus.DECLINED
        updated = self._dao.update_status_atomically(
            invite_id,
            expected_status=AppointmentStatus.PENDING,
            new_status=status,
        )

        if updated:
            msg_type = MessageType.COFFEE_CHAT_ACCEPTED if accept else MessageType.COFFEE_CHAT_DECLINED
            msg = Message(
                msg_type,
                {
                    "invite_id": invite_id,
                    "responder_id": responder.user_id
                }
            )
            MessageBus.publish(msg)
            return True

        return False

    # Checks if a given scheduled_at is free for the specified user.
    def validate_availability(self, user_id: str, scheduled_at: datetime) -> bool:
        busy_slots = self._dao.get_occupied_slots(user_id)
        slot_label = scheduled_at.strftime("%a, %b %d @ %I:%M %p").replace(" 0", " ")
        return slot_label not in busy_slots
