"""
Lifecycle Service
Handles event lifecycle operations using LifecycleDAO for persistence
and the State Pattern for transition/permission validation.
"""

from app.lifecycle.lifecycle_dao import LifecycleDAO
from app.lifecycle.model.Event import Event
from app.lifecycle.schemas import PublicEvent, EventResponse
from app.lifecycle.states import resolve_state
from app.bus.message import Message, MessageType
from app.bus.message_bus import MessageBus, Service
LIFECYCLE_SERVICE_EXTENSION_KEY = "lifecycle_service"


def get_lifecycle_service() -> "LifecycleService":
    from flask import current_app

    return current_app.extensions[LIFECYCLE_SERVICE_EXTENSION_KEY]


class LifecycleService(Service):
    def __init__(self, lifecycle_dao: LifecycleDAO | None = None) -> None:
        super().__init__()
        self._dao = lifecycle_dao or LifecycleDAO()

    @staticmethod
    def _to_public_event(event: Event) -> PublicEvent:
        return PublicEvent(
            id=event.id,
            title=event.title,
            description=event.description,
            owner_id=event.owner_id,
            status=event.status,
            created_at=event.created_at.isoformat(),
            updated_at=event.updated_at.isoformat(),
        )

    def get_event(self, event_id: str) -> EventResponse:
        event = self._dao.find_by_id(event_id)
        if event is None:
            return EventResponse(message="Event not found", event=None, code=404)
        return EventResponse(
            message="Success",
            event=self._to_public_event(event),
            code=200,
        )

    def transition(
        self, event_id: str, target_status: str, requester_id: str
    ) -> EventResponse:
        event = self._dao.find_by_id(event_id)
        if event is None:
            return EventResponse(message="Event not found", event=None, code=404)

        if event.owner_id != requester_id:
            return EventResponse(
                message="Only the event owner can change the event state",
                event=None,
                code=403,
            )

        state = resolve_state(event.status)
        try:
            state.handle_transition(target_status)
        except ValueError as e:
            return EventResponse(message=str(e), event=None, code=400)

        updated = self._dao.update_status(event_id, target_status)

        # Notify TasksService so they can react to the state change.
        # e.g. If an event transitions to "completed", TasksService might mark related tasks as done.
        MessageBus.publish(
            Message(
                MessageType.LIFECYCLE_MESSAGE,
                {"event_id": event_id, "new_status": target_status},
            )
        )

        return EventResponse(
            message="Success",
            event=self._to_public_event(updated),
            code=200,
        )
