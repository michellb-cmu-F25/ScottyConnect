"""
Popularity-based recommendation strategy.

Stub — requires an attendance / popularity signal that is not yet modelled.
Returns an empty list until that data source is added.
"""

from app.recommendation.dao.event_tag_dao import EventTagDAO
from app.recommendation.strategies.base import RecommendationStrategy


class PopularityBasedRecommendationStrategy(RecommendationStrategy):
    def __init__(self, event_tag_dao: EventTagDAO) -> None:
        self._event_tag_dao = event_tag_dao

    def recommend(self, user_id: str, limit: int = 20) -> list[str]:
        # TODO: integrate AttendanceDAO once attendance data is available.
        return []
