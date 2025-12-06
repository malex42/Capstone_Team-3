from datetime import datetime
from pymongo import ASCENDING
from handlers.db_handler import DatabaseHandler
from handlers.schedule_handler import ScheduleHandler


class ActivityHandler:

    def __init__(self, db_handler: DatabaseHandler):
        """ Initializes the ActivityHandler with the database handler """
        db = db_handler.database
        self.schedules = db["Schedules"]

        # Initialize database for activity management -
        # Create 'Activity' Collection if it does not already exist
        if "Activity" not in db.list_collection_names():
            db.create_collection("Activity")

        self.activity = db["Activity"]

    def get_upcoming_shift(self, user_id: str, business_code: str):
        now_iso = datetime.utcnow().isoformat() + "Z"

        query = {
            "business_code": business_code,
            "shifts": {
                "$elemMatch": {
                    "employee_id": user_id,
                    "clocked_in": False,
                    "completed": False,
                    "start": {"$gte": now_iso}
                }
            }
        }

        projection = {
            "shifts": 1,
            "_id": 0
        }

        doc = self.schedules.find_one(query, projection)

        if not doc or "shifts" not in doc:
            return False

        # Filter again to isolate only valid upcoming shifts
        upcoming_shifts = [
            s for s in doc["shifts"]
            if s.get("employee_id") == user_id
               and not s.get("clocked_in", False)
               and not s.get("completed", False)
               and s.get("start") >= now_iso
        ]

        if not upcoming_shifts:
            return False

        # Sort by soonest upcoming
        upcoming_shifts.sort(key=lambda s: s["start"])

        return upcoming_shifts[0]