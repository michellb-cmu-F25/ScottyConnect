# Data access for event-tag associations.
#
# NOTE: The events collection is not yet designed.  For now this DAO only
# works against `event_tags` to support tag-based recommendations.
# Methods depending on a real `events` collection are stubbed and will be
# completed once that schema is finalised.

from app.recommendation.model.EventTag import EventTag
from app.utils.db import Database, get_database
from bson import ObjectId

EVENT_TAGS_COLLECTION = "event_tags"


class EventTagDAO:
    def __init__(self, database: Database | None = None) -> None:
        self._database = database or get_database()

    @property
    def _col(self):
        return self._database.db[EVENT_TAGS_COLLECTION]

    def find_event_ids_by_tags(self, tag_ids: list[str]) -> dict[str, int]:
        """
        Return a mapping of event_id -> overlap_count for all events that
        share at least one tag with the given tag_ids list.
        """
        docs = self._col.find({"tag_id": {"$in": [ObjectId(tag_id) for tag_id in tag_ids]}})
        scores: dict[str, int] = {}
        for doc in docs:
            event_id = str(doc["event_id"])
            scores[event_id] = scores.get(event_id, 0) + 1
        return scores

    def add_event_tag(self, event_tag: EventTag) -> EventTag:
        """Associate a tag with an event (idempotent on event_id + tag_id)."""
        if self._col.find_one({"event_id": event_tag.event_id, "tag_id": event_tag.tag_id}):
            return event_tag
        doc = event_tag.model_dump(exclude={"id"}, exclude_none=True)
        result = self._col.insert_one(doc)
        return event_tag.model_copy(update={"id": str(result.inserted_id)})

    def remove_event_tag(self, event_id: str, tag_id: str) -> bool:
        result = self._col.delete_one({"event_id": ObjectId(event_id), "tag_id": ObjectId(tag_id)})
        return result.deleted_count > 0

    def get_all_event_ids(self) -> list[str]:
        """
        Stub — returns all unique event_ids present in event_tags.
        Will be replaced once a proper `events` collection exists.
        """
        return list(self._col.distinct("event_id"))

    @staticmethod
    def _to_event_tag(doc: dict) -> EventTag:
        payload = dict(doc)
        oid = payload.pop("_id", None)
        if oid is not None:
            payload["id"] = str(oid)
        payload["event_id"] = str(payload["event_id"])
        payload["tag_id"] = str(payload["tag_id"])
        return EventTag.model_validate(payload)
