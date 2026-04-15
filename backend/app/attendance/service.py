"""
Attendance Service
Handles attendance operations using AttendanceDAO for persistence.
"""

from datetime import datetime, timezone

from app.accounts.model.User import User
from app.accounts.schemas import PublicUser
from app.attendance.attendance_dao import AttendanceDAO
from app.attendance.model.AttendanceRecord import AttendanceRecord
from app.attendance.schemas import (
    AttendanceRecordResponse,
    AttendEventResponse,
    RegisterEventResponse,
)
from app.bus.message_bus import Service

ATTENDANCE_SERVICE_EXTENSION_KEY = "attendance_service"

def get_attendance_service() -> "AttendanceService":
    from flask import current_app

    return current_app.extensions[ATTENDANCE_SERVICE_EXTENSION_KEY]


class AttendanceService(Service):
    def __init__(self, attendance_dao: AttendanceDAO | None = None) -> None:
        super().__init__()
        self._dao = attendance_dao or AttendanceDAO()

    @staticmethod
    def _to_public_user(user: User) -> PublicUser:
        return PublicUser(
            id=user.id,
            username=user.username,
            email=user.email,
            verified=user.verified,
            role=user.role,
            bio=user.bio,
            tags=user.tags,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
    # Registration operations

    # Registers a single user for an event.
    def register_event(self, event_id: str, user_id: str) -> RegisterEventResponse:
        """Registers a user for an event."""
        event = self._dao.find_event_by_id(event_id)
        if not event:
            return RegisterEventResponse(registered=False, message="Event no longer available.", code=404)
        existing_registration = self._dao.find_record_by_event_and_user(event_id, user_id)
        if existing_registration:
            return RegisterEventResponse(registered=True, message="User is already registered for this event.", code=409)
        self._dao.insert(AttendanceRecord(event_id=event_id, user_id=user_id))
        # TODO: Send message to message bus to notify the user that they have been registered for the event
        return RegisterEventResponse(registered=True, message="Successfully registered for the event.", code=201)

    # Unregisters a single user from an event.
    def unregister_event(self, event_id: str, user_id: str) -> RegisterEventResponse:
        """Unregisters a user from an event."""
        registration = self._dao.find_record_by_event_and_user(event_id, user_id)
        if not registration:
            return RegisterEventResponse(registered=False, message="User is not registered for this event.", code=404)
        self._dao.delete(registration.id)
        # TODO: Send message to message bus to notify the user that they have been unregistered from the event
        return RegisterEventResponse(registered=False, message="Successfully unregistered from the event.", code=200)

    # Attendance operations

    # Marks a user as attended an event by the organizer
    def attend_event(self, event_id: str, user_id: str, organizer_id: str) -> AttendEventResponse:
        """Marks a user as attended an event."""
        # Verify that the organizer is the owner of the event
        event = self._dao.find_event_by_id(event_id)
        if not event:
            return AttendEventResponse(message="Event no longer available.", code=404)
        if event.owner_id != organizer_id:
            return AttendEventResponse(message="You are not the organizer of this event.", code=403)
        registration = self._dao.find_record_by_event_and_user(event_id, user_id)
        if not registration:
            return AttendEventResponse(message="User is not registered for this event.", code=404)
        self._dao.update(registration.id, {"attendance_time": datetime.now(timezone.utc)})
        # TODO: Send message to message bus to notify the user that they have been marked as attended
        return AttendEventResponse(message="Successfully marked as attended the event.", code=200)

    # Marks a user as not attended an event.
    def unattend_event(self, event_id: str, user_id: str, organizer_id: str) -> AttendEventResponse:
        """Marks a user as not attended an event."""
        # Verify that the organizer is the owner of the event
        event = self._dao.find_event_by_id(event_id)
        if not event:
            return AttendEventResponse(message="Event no longer available.", code=404)
        if event.owner_id != organizer_id:
            return AttendEventResponse(message="You are not the organizer of this event.", code=403)
        registration = self._dao.find_record_by_event_and_user(event_id, user_id)
        if not registration:
            return AttendEventResponse(message="User is not registered for this event.", code=404)
        self._dao.update(registration.id, {"attendance_time": None})
        # TODO: Send message to message bus to notify the user that they have been marked as not attended
        return AttendEventResponse(message="Successfully marked as not attended the event.", code=200)
    
    # Retrieves all registered users for an event.
    def get_registered_users(self, event_id: str) -> AttendanceRecordResponse:
        """Retrieves all registered users for an event."""
        event = self._dao.find_event_by_id(event_id)
        if not event:
            return AttendanceRecordResponse(message="Event no longer available.", code=404, users=[])
        users = [self._to_public_user(user) for user in self._dao.get_registered_users(event_id)]
        return AttendanceRecordResponse(message="Successfully retrieved all registered users for the event.", code=200, users=users)
    
    # Retrieves all attended users for an event.
    def get_attended_users(self, event_id: str) -> AttendanceRecordResponse:
        """Retrieves all attended users for an event."""
        event = self._dao.find_event_by_id(event_id)
        if not event:
            return AttendanceRecordResponse(message="Event no longer available.", code=404, users=[])
        users = [self._to_public_user(user) for user in self._dao.get_attended_users(event_id)]
        return AttendanceRecordResponse(message="Successfully retrieved all attended users for the event.", code=200, users=users)
    
    # Checks a user's registration status for an event.
    def get_registration_status(self, event_id: str, user_id: str) -> RegisterEventResponse:
        """Checks a user's registration status for an event."""
        event = self._dao.find_event_by_id(event_id)
        if not event:
            return RegisterEventResponse(registered=False, message="Event no longer available.", code=404)
        registration = self._dao.find_record_by_event_and_user(event_id, user_id)
        if not registration:
            return RegisterEventResponse(registered=False, message="User is not registered for this event.", code=200)
        return RegisterEventResponse(registered=True, message="User is registered for this event.", code=200)