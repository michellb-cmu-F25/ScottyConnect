"""
Feedback Schemas
Pydantic models for feedback request validation and API responses.
"""

from datetime import datetime

from pydantic import BaseModel


# Request body for submitting feedback on an event.
class SubmitFeedbackRequest(BaseModel):
    rating: int
    comment: str = ""


# Public-facing feedback record.
# participant_id is included so organizers can look up who submitted each review.
class PublicFeedback(BaseModel):
    id: str | None
    event_id: str
    participant_id: str
    rating: int
    comment: str
    created_at: datetime


# Status response — tells the frontend whether feedback is open for an event
# and whether the current user is in the eligible pool.
class FeedbackStatusResponse(BaseModel):
    message: str
    enabled: bool
    eligible: bool
    code: int


# Single feedback response schema.
class FeedbackResponse(BaseModel):
    message: str
    feedback: PublicFeedback | None
    code: int


# List feedback response schema.
class FeedbackListResponse(BaseModel):
    message: str
    feedbacks: list[PublicFeedback]
    code: int
