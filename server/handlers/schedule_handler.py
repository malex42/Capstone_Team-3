from datetime import datetime

import pymongo
from bson import ObjectId

from handlers.db_handler import DatabaseHandler


class ScheduleHandler:

    def __init__(self, db_handler: DatabaseHandler):
        """ Initializes the ScheduleHandler with database connection """
        db = db_handler.database

        # Initialize database for schedule management -
        # Create 'Schedules' Collection if it does not already exist
        if "Schedules" not in db.list_collection_names():
            db.create_collection("Schedules")

        self.schedules_collection = db["Schedules"]

        # Ensure field 'year' exists
        self.schedules_collection.create_index([("year", 1)], unique=True)

        # Ensure field 'month' exists
        self.schedules_collection.create_index([("month", 1)], unique=False)

        # Ensure field 'business_code' exists
        self.schedules_collection.create_index([("business_code", 1)], unique=False)

        # Ensure field 'shifts' exists
        self.schedules_collection.create_index([("shifts", 1)], unique=False)

    def _insert_schedule(self, year: str, month: str, business_code: str, user_id: str):
        """ Helper method to insert a new schedule into the database """

        schedule_dict = {
            "year": year,
            "month": month,
            "business_code": business_code,
            "shifts": [],
            "created_at": datetime.now(),
            "created_by": user_id
        }

        self.schedules_collection.insert_one(schedule_dict)

    def _insert_shift(self, schedule_id: str, shift: dict):
        result = self.schedules_collection.update_one(
            {"_id": ObjectId(schedule_id)},
            {"$push": {"shifts": shift}}
        )

        if result.modified_count > 0:
            return True
        else:
            return False


    def new_schedule(self, year: str, month: str, business_code: str, user_id: str):
        try:
            self._insert_schedule(year, month, business_code, user_id)
            return True
        except pymongo.errors.DuplicateKeyError:
            return False

    def get_schedules(self, business_code: str):
        schedules = list(self.schedules_collection.find({'business_code': business_code}))
        return schedules

    def add_shift(self, schedule_id: str, shift: dict):

        required_keys = ['employee_id', 'start', 'end']

        # Check that all required keys are present in the shift dictionary
        if not all(key in shift for key in required_keys):
            return False

        # Add a unique _id field to the shift
        shift.update({'_id': ObjectId()})

        if self._insert_shift(schedule_id=schedule_id, shift=shift):
            return True

        return False
