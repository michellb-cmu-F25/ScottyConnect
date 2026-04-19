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
from threading import Lock, Thread

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
        self._worker: Thread | None = None
        self._worker_lock = Lock()
        self._dao = EmailDAO()
        self.key = NOTIFICATION_SERVICE_EXTENSION_KEY
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
            logger.error(f"Invalid message type: {message_type}")
            return
        self._dao.insert(email)

    def poll_and_send_emails(self) -> None:
        while True:
            try:
                emails = self._dao.find_unsent_emails()
                for email in emails:
                    try:
                        if self._send_email(email):
                            self._dao.update_sent_successfully(email.id)
                    except Exception:
                        logger.error(
                            "Failed to process email notification id=%s", email.id
                        )
            except Exception:
                logger.error("Notification polling cycle failed")
            time.sleep(60)
        
    def _send_email(self, email: Email) -> bool:
        logger.warning(f"Sending email to {email.recipient_email} for event {email.event_id}")
        return True
    
    def start_worker(self) -> None:
        with self._worker_lock:
            if self._worker and self._worker.is_alive():
                return
            self._worker = Thread(
                target=self.poll_and_send_emails,
                name="notification-worker",
                daemon=True,
            )
            self._worker.start()
            logger.warning("Started notification worker thread")