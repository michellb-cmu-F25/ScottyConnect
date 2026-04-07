"""
Appointment Model
Defines the structure and lifecycle of a coffee chat appointment.
"""

from datetime import datetime, timezone
from enum import Enum
from pydantic import BaseModel, Field


class AppointmentStatus(str, Enum):
    """Possible statuses for a coffee chat invitation."""
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    COMPLETED = "COMPLETED"


class Appointment(BaseModel):
    """Domain model for a coffee chat appointment."""
    id: str | None = None
    sender_id: str
    receiver_id: str
    timeslot: str
    status: AppointmentStatus = AppointmentStatus.PENDING
    
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
