"""
Lifecycle Service
Handles event lifecycle operations using LifecycleDAO for persistence
and the State Pattern for transition/permission validation.
"""

from app.lifecycle.lifecycle_dao import LifecycleDAO
from app.lifecycle.model.Event import Event
from app.lifecycle.schemas import (
    CreateEventRequest,
    EventListResponse,
    EventResponse,
    PublicEvent,
    UpdateEventRequest,
)
from app.lifecycle.schedule_validation import validate_event_schedule
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
            date=event.date,
            start_time=event.start_time,
            end_time=event.end_time,
            location=event.location,
            capacity=event.capacity,
            owner_id=event.owner_id,
            status=event.status,
            created_at=event.created_at.isoformat(),
            updated_at=event.updated_at.isoformat(),
        )

    def create_event(
        self, req: CreateEventRequest, owner_id: str
    ) -> EventResponse:
        try:
            validate_event_schedule(req.date, req.start_time, req.end_time)
        except ValueError as e:
            return EventResponse(message=str(e), event=None, code=400)

        event = Event(
            title=req.title,
            description=req.description,
            date=req.date,
            start_time=req.start_time,
            end_time=req.end_time,
            location=req.location,
            capacity=req.capacity,
            owner_id=owner_id,
            status=req.status,
        )
        saved = self._dao.insert(event)
        return EventResponse(
            message="Event created",
            event=self._to_public_event(saved),
            code=201,
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

        old_status = event.status
        updated = self._dao.update_status(event_id, target_status)

        # Notify TasksService so they can react to the state change.
        # e.g. If an event transitions to "completed", TasksService might mark related tasks as done.
        MessageBus.publish(
            Message(
                MessageType.LIFECYCLE_MESSAGE,
                {
                    "event_id": event_id,
                    "new_status": target_status,
                    "old_status": old_status,
                },
            )
        )

        return EventResponse(
            message="Success",
            event=self._to_public_event(updated),
            code=200,
        )

    def list_mine(self, user_id: str) -> EventListResponse:
        events = self._dao.find_by_owner(user_id)
        return EventListResponse(
            message="Success",
            events=[self._to_public_event(e) for e in events],
            code=200,
        )

    def list_published(self) -> EventListResponse:
        events = self._dao.find_by_status("published")
        return EventListResponse(
            message="Success",
            events=[self._to_public_event(e) for e in events],
            code=200,
        )

    def update_event(
        self, event_id: str, req: UpdateEventRequest, user_id: str
    ) -> EventResponse:
        event = self._dao.find_by_id(event_id)
        if event is None:
            return EventResponse(message="Event not found", event=None, code=404)
        is_owner = event.owner_id == user_id
        if event.owner_id != user_id:
            return EventResponse(
                message="Only the event owner can update this event",
                event=None,
                code=403,
            )
        state = resolve_state(event.status)
        try:
            state.validate_edit_event(is_owner)
        except ValueError as e:
            return EventResponse(message=str(e), event=None, code=400)

        data = req.model_dump(exclude_unset=True)
        target_status = data.pop("status", None)
        if target_status is None:
            target_status = event.status

        if target_status != event.status:
            state = resolve_state(event.status)
            try:
                state.handle_transition(target_status)
            except ValueError as e:
                return EventResponse(message=str(e), event=None, code=400)

        merged_date = data.get("date", event.date)
        merged_start = data.get("start_time", event.start_time)
        merged_end = data.get("end_time", event.end_time)
        try:
            validate_event_schedule(merged_date, merged_start, merged_end)
        except ValueError as e:
            return EventResponse(message=str(e), event=None, code=400)

        updates: dict = {}
        field_map = (
            ("title", "title"),
            ("description", "description"),
            ("date", "date"),
            ("start_time", "start_time"),
            ("end_time", "end_time"),
            ("location", "location"),
            ("capacity", "capacity"),
        )
        for key, mongo_key in field_map:
            if key in data:
                updates[mongo_key] = data[key]
        if target_status != event.status:
            updates["status"] = target_status

        updated = self._dao.update_fields(event_id, updates)
        return EventResponse(
            message="Success",
            event=self._to_public_event(updated),
            code=200,
        )

    def delete_event(self, event_id: str, user_id: str) -> EventResponse:
        event = self._dao.find_by_id(event_id)
        if event is None:
            return EventResponse(message="Event not found", event=None, code=404)
        is_owner = event.owner_id == user_id
        if event.owner_id != user_id:
            return EventResponse(
                message="Only the event owner can delete this event",
                event=None,
                code=403,
            )
        state = resolve_state(event.status)
        try:
            state.validate_delete_event(is_owner)
        except ValueError as e:
            return EventResponse(message=str(e), event=None, code=400)
        self._dao.delete_by_id(event_id)
        return EventResponse(message="Event deleted", event=None, code=200)
