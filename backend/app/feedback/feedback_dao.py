# Data access for Feedback documents in MongoDB.

from datetime import datetime, timezone

from app.feedback.model.Feedback import Feedback
from app.utils.db import Database, get_database

FEEDBACK_COLLECTION = "feedback"
FEEDBACK_SESSIONS_COLLECTION = "feedback_sessions"
ATTENDANCE_RECORDS_COLLECTION = "attendance_records"


class FeedbackDAO:
    def __init__(self, database: Database | None = None) -> None:
        self._database = database or get_database()

    @property
    def _col(self):
        return self._database.db[FEEDBACK_COLLECTION]

    @property
    def _sessions_col(self):
        return self._database.db[FEEDBACK_SESSIONS_COLLECTION]

    @property
    def _attendance_col(self):
        return self._database.db[ATTENDANCE_RECORDS_COLLECTION]

    # Converts a MongoDB document to a Feedback object.
    @staticmethod
    def _to_feedback(doc: dict | None) -> Feedback | None:
        if doc is None:
            return None
        payload = dict(doc)
        oid = payload.pop("_id", None)
        if oid is not None:
            payload["id"] = str(oid)
        return Feedback.model_validate(payload)

    # --- Feedback documents ---

    # Inserts a new feedback document into the database.
    def insert(self, feedback: Feedback) -> Feedback:
        doc = feedback.model_dump(exclude={"id"}, exclude_none=True)
        result = self._col.insert_one(doc)
        return feedback.model_copy(update={"id": str(result.inserted_id)})

    # Finds all feedback submitted for a given event, newest first.
    def find_by_event(self, event_id: str) -> list[Feedback]:
        cursor = self._col.find({"event_id": event_id}).sort("created_at", -1)
        return [f for doc in cursor if (f := self._to_feedback(doc)) is not None]

    # Finds all feedback submitted by a given user, newest first.
    def find_by_user(self, user_id: str) -> list[Feedback]:
        cursor = self._col.find({"participant_id": user_id}).sort("created_at", -1)
        return [f for doc in cursor if (f := self._to_feedback(doc)) is not None]

    # Finds a user's own feedback for a specific event.
    # Primary use: GET query so a user can view the feedback they submitted for an event.
    # Also used internally by submit_feedback to detect duplicate submissions.
    def find_by_event_and_participant(self, event_id: str, participant_id: str) -> Feedback | None:
        doc = self._col.find_one({"event_id": event_id, "participant_id": participant_id})
        return self._to_feedback(doc)

    # --- Feedback sessions (tracks which events have feedback open and for whom) ---

    # Opens the feedback window for an event by storing the list of eligible user IDs.
    # Called when the lifecycle module transitions an event to "ended".
    def enable_feedback(self, event_id: str, eligible_user_ids: list[str]) -> None:
        self._sessions_col.update_one(
            {"event_id": event_id},
            {"$set": {
                "event_id": event_id,
                "eligible_user_ids": eligible_user_ids,
                "enabled_at": datetime.now(timezone.utc),
            }},
            upsert=True,
        )

    # Checks whether the feedback window is open for a given event.
    def is_feedback_enabled(self, event_id: str) -> bool:
        doc = self._sessions_col.find_one({"event_id": event_id})
        return doc is not None

    # Returns the list of user IDs who are eligible to submit feedback for an event.
    def get_eligible_user_ids(self, event_id: str) -> list[str]:
        doc = self._sessions_col.find_one({"event_id": event_id})
        if doc is None:
            return []
        return doc.get("eligible_user_ids", [])

    # --- Attendance cross-checks ---

    # Returns the user IDs of all registered users for an event.
    # These are the users for whom the feedback window is opened when an event ends.
    # Uses registration (not check-in) as eligibility since the app does not track check-ins.
    def find_attendees_by_event(self, event_id: str) -> list[str]:
        cursor = self._attendance_col.find({"event_id": event_id})
        user_ids = []
        for doc in cursor:
            user_id = doc.get("user_id")
            if user_id:
                user_ids.append(user_id)
        return user_ids

    # Checks whether a single user has a registration record for an event.
    # Used as the eligibility gate when a user attempts to submit feedback.
    def find_attendance_record(self, event_id: str, participant_id: str) -> bool:
        doc = self._attendance_col.find_one({
            "event_id": event_id,
            "user_id": participant_id,
        })
        return doc is not None
