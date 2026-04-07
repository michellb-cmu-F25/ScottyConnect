# backend/app/lifecycle/schemas.py
"""
Schemas for the Lifecycle service.
"""
from pydantic import BaseModel


# Create event request schema
class CreateEventRequest(BaseModel):
    title: str
    description: str

# Update event request schema
class UpdateEventRequest(BaseModel):
    title: str | None = None
    description: str | None = None

# Transition request schema
class TransitionRequest(BaseModel):
    target_status: str


# Public event schema (used for response)
class PublicEvent(BaseModel):
    id: str | None
    title: str
    description: str
    owner_id: str
    status: str
    created_at: str
    updated_at: str

# Event response schema
class EventResponse(BaseModel):
    message: str
    event: PublicEvent | None
    code: int

# Event list response schema
class EventListResponse(BaseModel):
    message: str
    events: list[PublicEvent]
    code: int
