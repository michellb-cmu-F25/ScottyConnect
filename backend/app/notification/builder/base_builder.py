"""
Email Builder Base Class
"""

from app.notification.model.Email import Email
from app.notification.builder.templates import EmailTemplates
from app.bus.message import Message
from datetime import datetime, timezone, timedelta

class EmailBuilder:   
    def __init__(self, message: Message):
        self.message = message
        email_template = EmailTemplates.message_type_to_email_template(message.get_type())
        self.template = email_template.template
        self.subject = email_template.subject
        self.email_type = email_template.email_type
        self.body = None
        self.recipient_email = message.data["recipient_email"]
        self.send_time = message.data["send_time"] if "send_time" in message.data else datetime.now(timezone.utc) + timedelta(minutes=1)

    def build(self) -> Email:
        """Build the email."""
        if self.body is None:
            raise ValueError("Body is not set")
            
        return Email(
            recipient_email=self.recipient_email,
            subject=self.subject,
            body=self.body,
            email_type=self.email_type,
            sent_at=self.send_time,
            sent_successfully=False,
        )