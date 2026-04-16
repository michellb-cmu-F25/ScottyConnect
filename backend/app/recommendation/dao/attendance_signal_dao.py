# Data access for attendance signals used by popularity-based recommendations.
#
# Reads directly from the shared `attendance_records` collection so that the
# recommendation service stays independent of the attendance service code.
# Only read operations live here — writes to attendance_records belong to
# the attendance service.

from app.utils.db import Database, get_database

ATTENDANCE_RECORDS_COLLECTION = "attendance_records"


class AttendanceSignalDAO:
    def __init__(self, database: Database | None = None) -> None:
        self._database = database or get_database()

    @property
    def _col(self):
        return self._database.db[ATTENDANCE_RECORDS_COLLECTION]

    def count_attendance_by_event(self) -> dict[str, int]:
        """
        Return a mapping of event_id -> number of users who actually attended
        (i.e. attendance_time is set). Events with zero attendance are omitted.
        """
        pipeline = [
            {"$match": {"attendance_time": {"$ne": None}}},
            {"$group": {"_id": "$event_id", "count": {"$sum": 1}}},
        ]
        return {doc["_id"]: doc["count"] for doc in self._col.aggregate(pipeline)}
