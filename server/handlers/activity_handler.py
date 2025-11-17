from datetime import datetime

from handlers.db_handler import DatabaseHandler
from handlers.schedule_handler import ScheduleHandler


class ActivityHandler:

    def __init__(self, schedule_handler: ScheduleHandler):
        """ Initializes the ActivityHandler with schedule handler """
        self.schedules = schedule_handler.schedules_collection


    def get_upcoming_shift(self, user_id: str):
        now = datetime.now()

        # Aggregation pipeline
        pipeline = [
            # Deconstruct the shifts array
            {"$unwind": "$shifts"},

            # Match shifts for the employee, not clocked in, not completed, and in the future
            {"$match": {
                "shifts.employee_id": user_id,
                "shifts.clocked_in": False,
                "shifts.completed": False,
                "shifts.start": {"$gte": now.isoformat()}
            }},

            # Sort by start time ascending
            {"$sort": {"shifts.start": 1}},

            # Limit to 1 result (next shift)
            {"$limit": 1},

            # Optional: project only the shift info
            {"$project": {"_id": 0, "shift": "$shifts"}}
        ]

        next_shift = list(self.schedules.aggregate(pipeline))

        if next_shift:
            return next_shift[0]['shift']
        else:
            return False