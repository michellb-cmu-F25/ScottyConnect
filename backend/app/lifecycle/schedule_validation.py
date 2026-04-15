"""
Validate event date/time: future start, end after start.
Times are interpreted in EVENT_TZ (default America/Los_Angeles) so API rules stay consistent.
"""

import os
from datetime import datetime

from zoneinfo import ZoneInfo


def _event_tz() -> ZoneInfo:
    name = os.getenv("EVENT_TZ", "America/Los_Angeles")
    return ZoneInfo(name)


def validate_event_schedule(
    date: str | None,
    start_time: str | None,
    end_time: str | None,
) -> None:
    """
    Raises ValueError with a user-facing message if validation fails.
    """
    if not date or not start_time or not end_time:
        raise ValueError("Date, start time, and end time are required.")

    tz = _event_tz()
    try:
        start_dt = datetime.strptime(f"{date} {start_time}", "%Y-%m-%d %H:%M").replace(
            tzinfo=tz
        )
        end_dt = datetime.strptime(f"{date} {end_time}", "%Y-%m-%d %H:%M").replace(
            tzinfo=tz
        )
    except ValueError as e:
        raise ValueError("Invalid date or time format.") from e

    now = datetime.now(tz)
    if end_dt <= start_dt:
        raise ValueError("End time must be after start time.")
    if start_dt <= now:
        raise ValueError("Event start must be in the future.")
