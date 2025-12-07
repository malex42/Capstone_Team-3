from datetime import datetime, timezone, timedelta

from bson import ObjectId
from pymongo import ASCENDING
from handlers.db_handler import DatabaseHandler
from handlers.schedule_handler import ScheduleHandler
from tools import parse_utc


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


    def _insert_activity(self, shift: dict, employee_id: str, employee_name: str, clock_in: bool, business_code: str):


        activity = {
            "shift_id": shift["_id"],
            "shift_start": shift["start"],
            "shift_end": shift["end"],
            "business_code": business_code,
            "employee_id": employee_id,
            "employee_name": employee_name,
            "clock_in": clock_in,
            "timestamp": datetime.now().isoformat() + 'Z'
        }

        self.activity.insert_one(activity)


    def _clock_in(self, schedule: dict, shift_id: str):

        now = datetime.now(timezone.utc)

        shift = next(
            (s for s in schedule["shifts"] if str(s["_id"]) == shift_id),
            None
        )

        if not shift:
            return False

        if shift["clocked_in"]:
            return False

        start = parse_utc(shift["start"])

        if not (start - timedelta(minutes=30) <= now <= start + timedelta(minutes=30)):
            return False

        result = self.schedules.find_one_and_update(
            {"shifts._id": shift["_id"]},
            {
                "$set": {
                    "shifts.$[s].clocked_in": True,
                    "shifts.$[s].clocked_in_at": now
                }
            },
            array_filters=[{"s._id": shift["_id"]}],
            return_document=True
        )

        if result is not None:
            self._insert_activity(shift=shift, employee_id=shift["employee_id"],
                                  employee_name=shift["employee_name"], clock_in=True, business_code=schedule["business_code"])

            return True


    def _clock_out(self, schedule: dict, shift_id: str):
        now = datetime.now(timezone.utc)

        shift = next(
            (s for s in schedule["shifts"] if str(s["_id"]) == shift_id),
            None
        )

        if not shift:
            return False

        if not shift["clocked_in"] or shift["completed"]:
            return False

        end = parse_utc(shift["end"])

        if not (end - timedelta(minutes=30) <= now <= end + timedelta(minutes=30)):
            return False

        result = self.schedules.find_one_and_update(
            {"shifts._id": shift["_id"]},
            {
                "$set": {
                    "shifts.$[s].completed": True,
                    "shifts.$[s].clocked_in": False,
                    "shifts.$[s].clocked_out_at": now
                }
            },
            array_filters=[{"s._id": shift["_id"]}],
            return_document=True
        )

        if result is not None:
            self._insert_activity(shift=shift, employee_id=shift["employee_id"],
                                  employee_name=shift["employee_name"], clock_in=False, business_code=schedule["business_code"])

            return True

    def get_upcoming_shift(self, user_id: str, business_code: str):
        now_iso = datetime.now().isoformat() + "Z"

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


    def log_activity(self, shift_id: str, clock_in: bool) -> bool:
        schedule = self.schedules.find_one({"shifts._id": shift_id})

        if not schedule:
            return False

        if clock_in:
            return self._clock_in(schedule, shift_id)
        else:
            return self._clock_out(schedule, shift_id)


    def get_employee_activities(self, business_code: str):
        activities = self.activity.find({"business_code": business_code})

        return list(activities)