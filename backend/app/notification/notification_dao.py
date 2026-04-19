"""
Notification DAO

Data access object for managing Notification documents in MongoDB.
"""

from app.notification.model.Email import Email, EmailType
from app.utils.db import Database, get_database
from datetime import datetime, timezone
from bson import ObjectId

EMAILS_COLLECTION = "emails"

class EmailDAO:
    def __init__(self, database: Database | None = None) -> None:
        self._database = database or get_database()

    @property
    def _col(self):
        return self._database.db[EMAILS_COLLECTION]

    def insert(self, email: Email) -> Email:
        # Keep datetimes as native BSON datetimes so range queries work.
        doc = email.model_dump(mode="python", exclude={"id"}, exclude_none=True)
        result = self._col.insert_one(doc)
        return email.model_copy(update={"id": str(result.inserted_id)})

    def update_sent_successfully(self, email_id: str) -> bool:
        result = self._col.update_one({"_id": ObjectId(email_id)}, {"$set": {"sent_successfully": True}})
        return result.modified_count > 0

    def find_by_recipient_email(self, recipient_email: str) -> list[Email]:
        emails = self._col.find({"recipient_email": recipient_email}).sort("created_at", -1)
        return [e for doc in emails if (e := self._to_email(doc)) is not None]

    def find_confirmation_email(self, recipient_email: str, event_id: str) -> Email | None:
        # Find the most recent confirmation email or cancellation email for a given recipient and event
        email = self._col.find_one(
            {
                "recipient_email": recipient_email,
                "event_id": event_id,
                "email_type": {
                    "$in": [
                        EmailType.EVENT_REGISTRATION_CONFIRMATION.value,
                        EmailType.EVENT_REGISTRATION_CANCELLED.value,
                    ]
                },
            },
            sort=[("created_at", -1)]
        )
        return self._to_email(email)
    
    def find_unsent_emails(self) -> list[Email]:
        # Backward compatible: previously, some rows stored send_time as strings.
        # Load unsent emails first, then compare in Python after model parsing.
        now = datetime.now(timezone.utc)
        emails = self._col.find({"sent_successfully": False}).sort("created_at", -1)
        ready_to_send: list[Email] = []
        for doc in emails:
            email = self._to_email(doc)
            if email is None:
                continue
            if email.send_time is None or email.send_time <= now:
                ready_to_send.append(email)
        return ready_to_send
    
    def delete(self, email_id: str) -> bool:
        result = self._col.delete_one({"_id": ObjectId(email_id)})
        return result.deleted_count > 0
    
    def delete_all_reminders_by_event_id(self, event_id: str) -> bool:
        result = self._col.delete_many({"event_id": event_id, "email_type": EmailType.EVENT_REMINDER.value})
        return result.deleted_count > 0

    @staticmethod
    def _to_email(doc: dict | None) -> Email | None:
        if doc is None:
            return None
        payload = dict(doc)
        oid = payload.pop("_id", None)
        if oid is not None:
            payload["id"] = str(oid)
        return Email.model_validate(payload)