"""
Feedback Schemas
Pydantic models for feedback request validation and API responses.
"""

from datetime import datetime

from pydantic import BaseModel


class SubmitFeedbackRequest(BaseModel):
    rating: int
    comment: str = ""


# participant_id exclud for anonymity?
class PublicFeedback(BaseModel):
    id: str | None
    event_id: str
    rating: int
    comment: str
    created_at: datetime

class FeedbackStatusResponse(BaseModel):
    message: str
    enabled: bool
    eligible: bool
    code: int


# Single feedback
class FeedbackResponse(BaseModel):
    message: str
    feedback: PublicFeedback | None
    code: int


# List feedback
class FeedbackListResponse(BaseModel):
    message: str
    feedbacks: list[PublicFeedback]
    code: int
