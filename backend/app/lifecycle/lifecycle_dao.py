# Data access for Event documents in MongoDB.

from datetime import datetime, timezone

from bson import ObjectId

from app.lifecycle.model.Event import Event
from app.utils.db import Database, get_database

EVENTS_COLLECTION = "events"


class LifecycleDAO:
    def __init__(self, database: Database | None = None) -> None:
        self._database = database or get_database()

    @property
    def _col(self):
        return self._database.db[EVENTS_COLLECTION]

    def insert(self, event: Event) -> Event:
        doc = event.model_dump(exclude={"id"}, exclude_none=True)
        result = self._col.insert_one(doc)
        return event.model_copy(update={"id": str(result.inserted_id)})

    def find_by_id(self, event_id: str) -> Event | None:
        doc = self._col.find_one({"_id": ObjectId(event_id)})
        return self._to_event(doc)

    def update_status(self, event_id: str, new_status: str) -> Event | None:
        now = datetime.now(timezone.utc)
        self._col.update_one(
            {"_id": ObjectId(event_id)},
            {"$set": {"status": new_status, "updated_at": now}},
        )
        return self.find_by_id(event_id)

    @staticmethod
    def _to_event(doc: dict | None) -> Event | None:
        if doc is None:
            return None
        payload = dict(doc)
        oid = payload.pop("_id", None)
        if oid is not None:
            payload["id"] = str(oid)
        return Event.model_validate(payload)
