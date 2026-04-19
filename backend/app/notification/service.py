"""
Notification Service

Handles notification operations using NotificationDAO for persistence.
"""

# Email Domain Utilities
from app.notification.notification_dao import EmailDAO
from app.notification.model.Email import Email

# Standard Utilities
import time
import logging

logger = logging.getLogger(__name__)

# Builders
from app.notification.builder.verification_builder import VerificationBuilder
from app.notification.builder.event_register_builder import EventRegisterBuilder
from app.notification.builder.event_unregister_builder import EventUnregisterBuilder
from app.notification.builder.event_update_builder import EventUpdateBuilder
from app.notification.builder.attendance_builder import AttendanceBuilder
from app.notification.builder.event_reminder_builder import EventReminderBuilder
from app.notification.builder.event_cancel_builder import EventCancelBuilder

# Message Bus
from app.bus.message_bus import Service
from app.bus.message import Message
from app.bus.message import MessageType

NOTIFICATION_SERVICE_EXTENSION_KEY = "notification_service"

SUBSCRIBED_MESSAGE_TYPES = [
    MessageType.REGISTER_MESSAGE,
    MessageType.EVENT_REGISTRATION_CONFIRMATION,
    MessageType.EVENT_REGISTRATION_CANCELLED,
    MessageType.EVENT_REMINDER,
    MessageType.EVENT_CANCELLED,
    MessageType.EVENT_UPDATED,
    MessageType.ATTENDANCE_RECORDED,
]

class NotificationService(Service):
    
    def __init__(self):
        super().__init__()
        self._dao = EmailDAO()
        self.subscribeToMessages(SUBSCRIBED_MESSAGE_TYPES)
        

    def processMessage(self, message: Message) -> None:
        message_type = message.get_type()
        if message_type == MessageType.REGISTER_MESSAGE:
            email = VerificationBuilder(message).build()
        elif message_type == MessageType.EVENT_REGISTRATION_CONFIRMATION:
            email = EventRegisterBuilder(message).build()
            prev_email = self._dao.find_confirmation_email(email.recipient_email, email.event_id)
            if prev_email:
                self._dao.delete(prev_email.id)
        elif message_type == MessageType.EVENT_REGISTRATION_CANCELLED:
            email = EventUnregisterBuilder(message).build()
            prev_email = self._dao.find_confirmation_email(email.recipient_email, email.event_id)
            if prev_email:
                self._dao.delete(prev_email.id)
        elif message_type == MessageType.EVENT_REMINDER:
            email = EventReminderBuilder(message).build()
        elif message_type == MessageType.EVENT_CANCELLED:
            email = EventCancelBuilder(message).build()
        elif message_type == MessageType.EVENT_UPDATED:
            email = EventUpdateBuilder(message).build()
        elif message_type == MessageType.ATTENDANCE_RECORDED:
            email = AttendanceBuilder(message).build()
        else:
            raise ValueError(f"Invalid message type: {message_type}")
        self._dao.insert(email)

    def poll_and_send_emails(self) -> None:
        emails = self._dao.find_unsent_emails()
        for email in emails:
            self._send_email(email)
            self._dao.update_sent_successfully(email.id)
        
    def _send_email(self, email: Email) -> None:
        logger.info(f"Sending email to {email.recipient_email} for event {email.event_id}")
    
    def run(self) -> None:
        # Poll and send emails every minute
        while True:
            self.poll_and_send_emails()
            time.sleep(60)