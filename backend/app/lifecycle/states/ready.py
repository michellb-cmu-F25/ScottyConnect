# Concrete state: Ready — tasks are finalized, event awaits publication.

from app.lifecycle.states.base import EventState


class ReadyState(EventState):

    @property
    def name(self) -> str:
        return "ready"

    def allowed_transitions(self) -> list[str]:
        return ["published"]

    def validate_create_task(self, is_owner: bool) -> None:
        if not is_owner:
            raise ValueError("Only the event owner can create tasks in 'ready' state")

    def validate_edit_task(self, is_owner: bool, is_claimed: bool) -> None:
        if not is_owner:
            raise ValueError("Only the event owner can edit tasks in 'ready' state")

    def validate_delete_task(self, is_owner: bool) -> None:
        if not is_owner:
            raise ValueError("Only the event owner can delete tasks in 'ready' state")

    def validate_view_tasks(self, is_owner: bool) -> None:
        if not is_owner:
            raise ValueError("Only the event owner can view tasks in 'ready' state")
