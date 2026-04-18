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


class UserPreferenceBody(BaseModel):
    """Request body for setting a user's recommendation preference."""

    preferred_strategy: str


class UserPreferenceResponse(BaseModel):
    """Response payload for the preference endpoints."""

    message: str
    user_id: str
    preferred_strategy: str
    code: int


class TagItem(BaseModel):
    """A single selectable tag."""

    id: str
    slug: str
    display_name: str | None = None


class TagListResponse(BaseModel):
    """Response listing all available tags."""

    message: str
    tags: list[TagItem]
    code: int


class UserTagsBody(BaseModel):
    """Request body for setting a user's interested tags."""

    tag_ids: list[str]


class UserTagsResponse(BaseModel):
    """Response payload for user-tag endpoints."""

    message: str
    user_id: str
    tag_ids: list[str]
    code: int


class EventTagsBody(BaseModel):
    """Request body for setting an event's tags."""

    tag_ids: list[str]


class EventTagsResponse(BaseModel):
    """Response payload for event-tag endpoints."""

    message: str
    event_id: str
    tag_ids: list[str]
    code: int
