"""
Notification Service

Handles notification operations using NotificationDAO for persistence.
"""

# Email Domain Utilities
from app.notification.notification_dao import EmailDAO
from app.notification.model.Email import Email
from app.notification.gmail_sender import GmailSender

# Standard Utilities
import logging
import time
from datetime import datetime, timedelta, timezone
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

    @staticmethod
    def _get_event_datetime(event_info: dict) -> datetime | None:
        event_date = event_info.get("date")
        start_time = event_info.get("start_time")
        if not isinstance(event_date, str) or not isinstance(start_time, str):
            return None
        try:
            event_time = datetime.strptime(
                f"{event_date} {start_time[:5]}", "%Y-%m-%d %H:%M"
            )
        except ValueError:
            return None
        # Treat schedule timestamps as UTC for consistent comparisons.
        return event_time.replace(tzinfo=timezone.utc)

    def processMessage(self, message: Message) -> None:
        message_type = message.get_type()
        emails = []
        if message_type == MessageType.REGISTER_MESSAGE:
            emails.append(VerificationBuilder(message).build())
        elif message_type == MessageType.EVENT_REGISTRATION_CONFIRMATION:
            email = EventRegisterBuilder(message).build()
            prev_email = self._dao.find_confirmation_email(email.recipient_email, email.event_id)
            if prev_email:
                self._dao.delete(prev_email.id)
                # Remove reminder for the recipient
                self._dao.delete_reminder(email.event_id, email.recipient_email)
            # Add new reminder for the recipient
            event_info = message.data["event_info"]
            event_time = self._get_event_datetime(event_info)
            if event_time is None:
                logger.error("Invalid event_info for reminder scheduling: %s", event_info)
            else:
                send_time = event_time - timedelta(hours=1)
                try:
                    self.publishMessage(Message(MessageType.EVENT_REMINDER, {
                        "event_id": event_info["id"],
                        "event_info": event_info,
                        "recipient_email": email.recipient_email,
                        "send_time": send_time.isoformat(),
                    }))
                except Exception as e:
                    logger.error("Failed to publish EVENT_REMINDER message: %s", e)
            emails.append(email)
        elif message_type == MessageType.EVENT_REGISTRATION_CANCELLED:
            email = EventUnregisterBuilder(message).build()
            # Delete previous confirmation email if it exists.
            prev_email = self._dao.find_confirmation_email(email.recipient_email, email.event_id)
            if prev_email:
                self._dao.delete(prev_email.id)
            # Remove reminder for the recipient
            self._dao.delete_reminder(email.event_id, email.recipient_email)
            emails.append(email)
        elif message_type == MessageType.EVENT_REMINDER:
            emails.append(EventReminderBuilder(message).build())
        elif message_type == MessageType.EVENT_CANCELLED:
            data = dict(message.get_data())

            # Send email to the recipient.
            if "recipient_email" in data:
                emails.append(EventCancelBuilder(message).build())
            else:
                event_id = data.get("event_id")
                if not isinstance(event_id, str):
                    logger.error("EVENT_CANCELLED missing event_id for recipient fan-out")
                    return
                recipients = self._dao.find_registered_user_emails(event_id)
                for recipient_email in recipients:
                    fanout_message = Message(
                        MessageType.EVENT_CANCELLED,
                        {**data, "recipient_email": recipient_email},
                    )
                    emails.append(EventCancelBuilder(fanout_message).build())
            # Delete all reminders for the event.
            if data.get("event_id"):
                self._dao.delete_all_reminders_by_event_id(data.get("event_id"))
            else:
                logger.error("EVENT_CANCELLED missing event_id for reminder deletion")
        elif message_type == MessageType.EVENT_UPDATED:
            # Not used for now - published events cannot be changed atm.
            emails.append(EventUpdateBuilder(message).build())
        elif message_type == MessageType.ATTENDANCE_RECORDED:
            emails.append(AttendanceBuilder(message).build())
        else:
            logger.error(f"Invalid message type: {message_type}")
            return
        for email in emails:
            self._dao.insert(email)

    def poll_and_send_emails(self) -> None:
        cnt = 1
        while True:
            try:
                logger.info("Polling for unsent emails -- cycle %d", cnt)
                emails = self._dao.find_unsent_emails()
                for email in emails:
                    try:
                        if self._send_email(email):
                            self._dao.update_sent_successfully(email.id)
                    except Exception:
                        logger.error(
                            "Failed to process email notification id=%s", email.id
                        )
            except Exception as e:
                logger.error("Notification polling cycle failed: %s", e)
            cnt += 1
            time.sleep(60)
        
    def _send_email(self, email: Email) -> bool:
        logger.info(f"Sending email to {email.recipient_email} for event {email.event_id}")
        return GmailSender().send_email(email.recipient_email, email.subject, email.body)
        
    
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
            logger.info("Started notification worker thread")