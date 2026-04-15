"""
Recommendation Service

Dispatches to the correct strategy via the factory, filters ranked results
to published events, then appends any remaining published events at the end
so the user always sees the full published catalog — ranked events first,
unranked published events after.
"""

from app.recommendation.dao.attendance_signal_dao import AttendanceSignalDAO
from app.recommendation.dao.event_signal_dao import EventSignalDAO
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
        event_signal_dao: EventSignalDAO | None = None,
    ) -> None:
        user_profile_dao = user_profile_dao or UserProfileDAO()
        event_tag_dao = event_tag_dao or EventTagDAO()
        attendance_signal_dao = attendance_signal_dao or AttendanceSignalDAO()
        self._event_signal_dao = event_signal_dao or EventSignalDAO()
        self._factory = RecommendationStrategyFactory(
            user_profile_dao, event_tag_dao, attendance_signal_dao
        )

    def get_recommendation(
        self, user_id: str, strategy: str, limit: int = 20
    ) -> RecommendationResponse:
        try:
            strategy_obj = self._factory.create_strategy(strategy)
        except ValueError as e:
            return RecommendationResponse(
                message=str(e), strategy=strategy, events=[], code=400
            )

        ranked_ids = strategy_obj.recommend(user_id, limit=limit)
        ranked_events = self._event_signal_dao.get_published_events_by_ids(ranked_ids)

        all_published = self._event_signal_dao.get_all_published_events()
        ranked_ids_set = {event.id for event in ranked_events}
        unranked_tail = [event for event in all_published if event.id not in ranked_ids_set]

        combined = ranked_events + unranked_tail
        return RecommendationResponse(
            message="Success",
            strategy=strategy,
            events=combined[:limit],
            code=200,
        )
