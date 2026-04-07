# Concrete state: Cancelled — event was abandoned, tasks are frozen for transparency.

from app.lifecycle.states.base import EventState


class CancelledState(EventState):

    @property
    def name(self) -> str:
        return "cancelled"

    def validate_view_tasks(self, is_owner: bool) -> None:
        pass
