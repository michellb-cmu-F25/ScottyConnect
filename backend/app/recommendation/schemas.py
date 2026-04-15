# Schemas for the Recommendation service.

from datetime import datetime

from pydantic import BaseModel


class RecommendedEvent(BaseModel):
    """Event payload returned by the recommendation service.

    Mirrors the shape of the shared `events` collection documents the
    recommendation service needs to surface. Defined locally (rather than
    imported from the lifecycle service) to keep services independent.
    """

    id: str
    title: str
    description: str
    date: str | None = None
    start_time: str | None = None
    end_time: str | None = None
    location: str | None = None
    capacity: int | None = None
    owner_id: str
    status: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class RecommendationResponse(BaseModel):
    message: str
    strategy: str
    events: list[RecommendedEvent]
    code: int
