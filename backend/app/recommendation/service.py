"""
Recommendation Service

Dispatches to the correct strategy via the factory and returns a structured
RecommendationResponse.
"""

from app.recommendation.dao.attendance_signal_dao import AttendanceSignalDAO
from app.recommendation.dao.event_tag_dao import EventTagDAO
from app.recommendation.dao.user_profile_dao import UserProfileDAO
from app.recommendation.schemas import RecommendationResponse
from app.recommendation.strategy_factory import RecommendationStrategyFactory

RECOMMENDATION_SERVICE_EXTENSION_KEY = "recommendation_service"


def get_recommendation_service() -> "RecommendationService":
    from flask import current_app

    return current_app.extensions[RECOMMENDATION_SERVICE_EXTENSION_KEY]


class RecommendationService:
    def __init__(
        self,
        user_profile_dao: UserProfileDAO | None = None,
        event_tag_dao: EventTagDAO | None = None,
        attendance_signal_dao: AttendanceSignalDAO | None = None,
    ) -> None:
        user_profile_dao = user_profile_dao or UserProfileDAO()
        event_tag_dao = event_tag_dao or EventTagDAO()
        attendance_signal_dao = attendance_signal_dao or AttendanceSignalDAO()
        self._factory = RecommendationStrategyFactory(
            user_profile_dao, event_tag_dao, attendance_signal_dao
        )

    def get_recommendation(
        self, user_id: str, strategy: str, limit: int = 20
    ) -> RecommendationResponse:
        try:
            dao = self._factory.create_strategy(strategy)
        except ValueError as e:
            return RecommendationResponse(
                message=str(e), strategy=strategy, event_ids=[], code=400
            )

        event_ids = dao.recommend(user_id, limit=limit)
        return RecommendationResponse(
            message="Success", strategy=strategy, event_ids=event_ids, code=200
        )
