"""
Appointment DAO
Data access object for managing Appointment documents in MongoDB.
"""

from datetime import datetime, time, timezone
from typing import List, Optional

from bson import ObjectId

from app.networking.model.Appointment import Appointment, AppointmentStatus
from app.utils.db import Database, get_database

APPOINTMENTS_COLLECTION = "appointments"


class AppointmentDAO:
    """Handles persistence logic for coffee chat appointments."""
    
    def __init__(self, database: Database | None = None) -> None:
        self._database = database or get_database()

    @property
    def _col(self):
        """Returns the MongoDB collection for appointments."""
        return self._database.db[APPOINTMENTS_COLLECTION]

    def insert(self, appointment: Appointment) -> Appointment:
        """Inserts a new appointment record."""
        doc = appointment.model_dump(exclude={"id"}, exclude_none=True)
        # Ensure status is stored as string
        doc["status"] = appointment.status.value
        result = self._col.insert_one(doc)
        return appointment.model_copy(update={"id": str(result.inserted_id)})

    def find_by_id(self, appointment_id: str) -> Optional[Appointment]:
        """Finds an appointment by its internal ObjectID."""
        try:
            doc = self._col.find_one({"_id": ObjectId(appointment_id)})
            return self._to_appointment(doc)
        except Exception:
            return None

    def update_status(self, appointment_id: str, status: AppointmentStatus) -> bool:
        """Updates the status and timestamp of an existing appointment."""
        now = datetime.now(timezone.utc)
        res = self._col.update_one(
            {"_id": ObjectId(appointment_id)},
            {"$set": {"status": status.value, "updated_at": now}},
        )
        return res.modified_count > 0

    def count_by_user_and_date(self, user_id: str, date: datetime) -> int:
        """Counts non-declined appointments for a user on a given calendar day."""
        start_of_day = datetime.combine(date.date(), time.min).replace(tzinfo=timezone.utc)
        end_of_day = datetime.combine(date.date(), time.max).replace(tzinfo=timezone.utc)
        
        query = {
            "sender_id": user_id,
            "created_at": {"$gte": start_of_day, "$lte": end_of_day},
            "status": {"$ne": AppointmentStatus.DECLINED.value}
        }
        return self._col.count_documents(query)

    def find_all_by_user(self, user_id: str) -> List[Appointment]:
        """Returns all appointments where the user is either the sender or receiver."""
        cursor = self._col.find({
            "$or": [{"sender_id": user_id}, {"receiver_id": user_id}]
        }).sort("created_at", -1)
        return [self._to_appointment(doc) for doc in cursor if doc]

    @staticmethod
    def _to_appointment(doc: dict | None) -> Optional[Appointment]:
        """Helper to convert MongoDB document to Appointment Pydantic model."""
        if doc is None:
            return None
        payload = dict(doc)
        oid = payload.pop("_id", None)
        if oid is not None:
            payload["id"] = str(oid)
        return Appointment.model_validate(payload)
