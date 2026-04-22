# Abstract base class for all recommendation strategies.

from abc import ABC, abstractmethod


class RecommendationStrategy(ABC):
    @abstractmethod
    def recommend(self, user_id: str) -> list[str]:
        """Return an ordered list of recommended event_ids for the given user."""
        ...
