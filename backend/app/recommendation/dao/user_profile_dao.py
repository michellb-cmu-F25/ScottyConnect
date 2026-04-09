# Data access for user-tag associations — feeds get_user_tags.

from app.recommendation.model.UserTag import UserTag
from app.utils.db import Database, get_database
from bson import ObjectId

USER_TAGS_COLLECTION = "user_tags"


class UserProfileDAO:
    def __init__(self, database: Database | None = None) -> None:
        self._database = database or get_database()

    @property
    def _col(self):
        return self._database.db[USER_TAGS_COLLECTION]

    def get_user_tags(self, user_id: str) -> list[str]:
        """Return all tag_ids associated with the given user."""
        docs = self._col.find({"user_id": ObjectId(user_id)})
        docs = [self._to_user_tag(doc) for doc in docs]
        return [doc.tag_id for doc in docs]

    def add_tag(self, user_tag: UserTag) -> UserTag:
        """Associate a tag with a user (idempotent on user_id + tag_id)."""
        if self._col.find_one({"user_id": ObjectId(user_tag.user_id), "tag_id": ObjectId(user_tag.tag_id)}):
            return user_tag
        doc = user_tag.model_dump(exclude={"id"}, exclude_none=True)
        result = self._col.insert_one(doc)
        return user_tag.model_copy(update={"id": str(result.inserted_id)})

    def remove_tag(self, user_id: str, tag_id: str) -> bool:
        result = self._col.delete_one({"user_id": ObjectId(user_id), "tag_id": ObjectId(tag_id)})
        return result.deleted_count > 0

    @staticmethod
    def _to_user_tag(doc: dict) -> UserTag:
        payload = dict(doc)
        oid = payload.pop("_id", None)
        if oid is not None:
            payload["id"] = str(oid)
        payload["tag_id"] = str(payload["tag_id"])
        payload["user_id"] = str(payload["user_id"])
        return UserTag.model_validate(payload)
