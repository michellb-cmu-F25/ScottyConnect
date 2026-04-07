# Domain shape for an event document (persistence via LifecycleDAO).

from datetime import datetime, timezone

from pydantic import BaseModel, Field


class Event(BaseModel):
    id: str | None = None
    title: str
    description: str
    owner_id: str
    status: str = "draft"
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
