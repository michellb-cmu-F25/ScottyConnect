"""
Email Persistence Model

This model is used to store email data in the database.
"""

from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field

class EmailType(Enum):
    VERIFICATION = "VERIFICATION"
    EVENT_REGISTRATION_CONFIRMATION = "EVENT_REGISTRATION_CONFIRMATION"
    EVENT_REGISTRATION_CANCELLED = "EVENT_REGISTRATION_CANCELLED"
    EVENT_REMINDER = "EVENT_REMINDER"
    EVENT_CANCELLED = "EVENT_CANCELLED"
    EVENT_UPDATED = "EVENT_UPDATED"
    ATTENDANCE_RECORDED = "ATTENDANCE_RECORDED"

class Email(BaseModel):
    id: str | None = None
    recipient_email: str
    subject: str
    body: str
    email_type: EmailType
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    sent_at: datetime | None = None
    sent_successfully: bool = False
    