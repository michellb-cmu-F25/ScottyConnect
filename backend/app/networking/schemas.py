"""
Networking Schemas
Pydantic models for networking request validation and API responses.
"""

from typing import List, Optional

from pydantic import BaseModel


class InviteRequest(BaseModel):
    """Schema for sending a coffee chat invitation."""
    sender_id: str
    receiver_id: str
    timeslot: str


class RespondRequest(BaseModel):
    """Schema for responding to a coffee chat invitation."""
    invite_id: str
    responder_id: str
    accept: bool


class AppointmentResponse(BaseModel):
    """Standardized response for appointment-related operations."""
    message: str
    code: int
    invite_id: Optional[str] = None


class AppointmentListResponse(BaseModel):
    """Standardized response for listing appointments."""
    appointments: List[dict]
    code: int
