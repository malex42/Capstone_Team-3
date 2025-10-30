from datetime import datetime

import pymongo
from pymongo import errors

from handlers.db_handler import DatabaseHandler
from handlers.exceptions.exceptions import BusinessAlreadyExistsError
from handlers.validation_handler import ValidationHandler
from tools import id_generator


class BusinessHandler:

    def __init__(self, db_handler: DatabaseHandler):
        """ Initializes the BusinessHandler with database handler """
        db = db_handler.database

        # Initialize database for business management -
        # Create 'Businesses' Collection if it does not already exist
        if "Businesses" not in db.list_collection_names():
            db.create_collection("Businesses")

        self.business_collection = db["Businesses"]

        # Ensure unique field 'business_name' exists
        self.business_collection.create_index([("business_name", 1)], unique=True)

        # Ensure field 'hours' exists
        self.business_collection.create_index([("hours", 1)], unique=False)

        # Ensure field 'code' exists
        self.business_collection.create_index([("code", 1)], unique=True)

        # Ensure field 'created_by' exists
        self.business_collection.create_index([("created_by", 1)], unique=False)

        # Ensure field 'created_dt' exists
        self.business_collection.create_index([("created_dt", 1)], unique=False)

        # Ensure field 'schedules' exists
        self.business_collection.create_index([("schedules", 1)], unique=True)

        # Create 'Employees' collection if it does not already exist
        if "Employees" not in db.list_collection_names():
            db.create_collection("Employees")

        self.employees_collection = db["Employees"]

        # Ensure field 'business code' exists
        self.employees_collection.create_index([("business_code", 1)], unique=False)

        # Ensure field username exists
        self.employees_collection.create_index([("username", 1)], unique=True)

        # Ensure field user id exists
        self.employees_collection.create_index([("user_id", 1)], unique=False)

    def _insert_business(self, business_name: str, hours: dict, user_id: str, code: str):
        business_dict = {
            "business_name": business_name,
            "hours": hours,
            "code": code,
            "created_by": user_id,
            "created_dt": datetime.now(),
            "schedules": {},
        }

        self.business_collection.insert_one(business_dict)

    def _insert_user(self, business: dict, user_id: str):
        pass
        # TODO, insert user's id into the "people" list in the business (append, not replace)
        # User ID, not username

        self.business_collection.update_one(
            {"_id": business["_id"]},
            {"$addToSet": {"employees": user_id}}
        )
        return True

    def create_business(self, business_name: str, hours: dict, user_id):
        """ Create a new business by validating input, generating a code, and inserting into the DB """

        # Validate input first - protect against attack
        if ValidationHandler.validate_user_input(business_name):
            business_code = str(id_generator())

            try:
                # Insert new business document into the DB
                self._insert_business(business_name, hours, user_id, business_code)
                return business_code

            except pymongo.errors.DuplicateKeyError:
                # Catch the DuplicateKeyError raised by _insert_business
                raise BusinessAlreadyExistsError

        return None

    def insert_user(self, code, username):
        pass
        # TODO 1. find business by the code (+ensure exists)
        business = self.business_collection.find_one({"code": code})
        if not business:
            raise ValueError("Business not found")

        # 2. get user_id from username (may need to pass in account handler instance)
        users_collection = self.db["Users"]
        user = users_collection.find_one({"username": username})

        if not user:
            raise ValueError("User could not be found")

        user_id = str(user.get('_id'))

        if not user_id:
            raise ValueError("Invalid user ID")

        # 3. use _insert_user to update the DB
        return self._insert_user(business, user_id)

    def get_all_employees(self, business_code: str):
        """ Get all employees by business code """
        employees = self.employees_collection.find({"business_code": business_code})

        return [
            {
              "employee_id": str(emp.get("_id")),
              "username": emp.get("username", ""),
              "first_name": emp.get("first_name", ""),
              "last_name": emp.get("last_name", "")
            }
            for emp in employees
        ]
