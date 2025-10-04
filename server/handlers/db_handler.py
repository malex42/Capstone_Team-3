from pymongo import MongoClient
from pymongo.server_api import ServerApi


class DatabaseHandler:

    def __init__(self, conn_string: str):
        """ Initializes the database connection using the provided connection string """

        if conn_string:
            uri = conn_string

            try:
                # Create a client from our connection string
                self.client = MongoClient(uri, server_api=ServerApi(version='1', strict=True, deprecation_errors=True))

                self.database = self.client['Capstone-T3']
                print("Successfully Connected to Database.")

            except Exception as e:
                print("Database Connection Unsuccessful. Please try again.\n", e)

        else:
            print("Cannot Connect to Database. Please Provide Connection String.")
