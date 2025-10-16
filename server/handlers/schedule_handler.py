from handlers.db_handler import DatabaseHandler


class ScheduleHandler:

    def __init__(self, db_handler: DatabaseHandler):
        """ Initializes the ScheduleHandler with database handler """
        db = db_handler.database

        # Initialize database for schedule management -
        # Create 'Schedules' Collection if it does not already exist
        if "Schedules" not in db.list_collection_names():
            db.create_collection("Schedules")

        self.schedules_collection = db["Schedules"]

        # Ensure unique field 'username' exists
        self.schedules_collection.create_index([("username", 1)], unique=True)

