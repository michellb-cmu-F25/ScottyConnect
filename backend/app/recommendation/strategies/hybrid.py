"""
Hybrid recommendation strategy.

Stub — combines tag-based and popularity signals.  Currently falls back to
tag-based only until a popularity / attendance data source is defined.
"""

from app.recommendation.dao.event_tag_dao import EventTagDAO
from app.recommendation.dao.user_profile_dao import UserProfileDAO
from app.recommendation.strategies.base import RecommendationStrategy
from app.recommendation.strategies.tag_based import TagBasedRecommendationStrategy


class HybridRecommendationStrategy(RecommendationStrategy):
    def __init__(
        self,
        user_profile_dao: UserProfileDAO,
        event_tag_dao: EventTagDAO,
    ) -> None:
        self._tag_strategy = TagBasedRecommendationStrategy(user_profile_dao, event_tag_dao)

    def recommend(self, user_id: str, limit: int = 20) -> list[str]:
        # TODO: blend with popularity scores once AttendanceDAO is ready.
        return self._tag_strategy.recommend(user_id, limit=limit)
