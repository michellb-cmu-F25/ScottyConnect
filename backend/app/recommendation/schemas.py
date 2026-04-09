# Schemas for the Recommendation service.

from pydantic import BaseModel


class RecommendationResponse(BaseModel):
    message: str
    strategy: str
    event_ids: list[str]
    code: int
