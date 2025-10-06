from itertools import chain
# from unittest.mock import inplace

import pymongo
from bson import ObjectId
from pymongo import errors
from handlers.enums.roles import Role
from handlers.db_handler import DatabaseHandler
from handlers.password_handler import PasswordHandler
from handlers.validation_handler import ValidationHandler
from handlers.exceptions.exceptions import UserAlreadyExistsError, PasswordFormatError


class AccountHandler:

    def __init__(self, db_handler: DatabaseHandler, pw_handler: PasswordHandler):
        """ Initializes the AccountHandler with database and password handlers """
        self.pw_handler = pw_handler
        db = db_handler.database

        # Initialize database for account management -
        # Create 'Users' Collection if it does not already exist
        if "Users" not in db.list_collection_names():
            db.create_collection("Users")

        self.users_collection = db["Users"]

        # Ensure unique field 'username' exists
        self.users_collection.create_index([("username", 1)], unique=True)

        # Ensure field 'password' exists
        self.users_collection.create_index([("password", 1)], unique=False)

        # Ensure field 'role' exists
        self.users_collection.create_index([("role", 1)], unique=False)

        # Ensure field 'business_code' exists
        self.users_collection.create_index([("business_code", 1)], unique=False)

    def _insert_user(self, input_username: str, hashed_password: str, role: str, code: str | None):
        """ Helper method to insert user into the database """

        user_dict = {
            "username": input_username,
            "password": hashed_password,
            "role": role,
            "business_code": code if code is not None else ''
        }
        additional_fields = {}

        match role:
            case Role.EMPLOYEE.value:
                additional_fields = {
                }

            case Role.MANAGER.value:
                additional_fields = {
                }

        user_dict.update(additional_fields)
        self.users_collection.insert_one(user_dict)

    def _get_users_role(self, user: dict):
        """ Helper method to return the role of the user """
        return user['role']

    def get_user_role(self, input_username: str) -> str:
        user = self.find_user_by_name(input_username)
        return self._get_users_role(user)

    def find_user_by_name(self, username: str) -> dict:
        """ Retrieve a user document by their username """
        return self.users_collection.find_one({"username": username})

    def create_user(self, input_username: str, input_password: str, role: str, code: str | None) -> bool:
        """ Create a new user by validating input, hashing the password, and inserting into the DB """

        # Validate input first - protect against attack
        if ValidationHandler.validate_user_input(input_username) and ValidationHandler.validate_user_input(input_password):

            try:
                # Check if password fits the required format
                if self.pw_handler.validate_password(input_password):

                    # Hash Password
                    hashed_pass = self.pw_handler.hash_password(input_password)

                    try:
                        # Insert new user document into the DB
                        self._insert_user(input_username, hashed_pass, role, code)
                        return True

                    except pymongo.errors.DuplicateKeyError:
                        # Catch the DuplicateKeyError raised by _insert_user
                        raise UserAlreadyExistsError

            except ValueError as e:
                # Catch the ValueError raised by validate_password
                raise PasswordFormatError(str(e)) from e

        return False

    def validate_login(self, input_username: str, input_password: str) -> bool:
        """ Validate user login by checking the username and password. """
        # Validate input
        if ValidationHandler.validate_user_input(input_username) and ValidationHandler.validate_user_input(
                input_password):
            user = self.find_user_by_name(input_username)

            if user is not None:
                stored_pass = user["password"]

                if self.pw_handler.verify_password_match(password=input_password, hashed_password=stored_pass):
                    return True

        return False



    # def delete_user(self, input_username: str, input_password: str) -> bool:
    #     """ Delete a user's account after validating their login credentials. """
    #     if self.validate_login(input_username, input_password):
    #         self._delete_user(input_username)
    #
    #         return True
    #
    #     return False
    #
    # def get_user_role(self, input_username: str) -> str:
    #     user = self.find_user_by_name(input_username)
    #     return self._get_users_role(user)
    #
    # def get_users_by_role(self, role: str | Role):
    #
    #     if isinstance(role, str):
    #         match role:
    #             case Role.EMPLOYEE.value:
    #                 return self._get_users_by_role(Role.EMPLOYEE)
    #
    #             case Role.MANAGER.value:
    #                 return self._get_users_by_role(Role.MANAGER)
    #             case _:
    #                 return []
    #
    #     elif isinstance(role, Role):
    #         return self._get_users_by_role(role)

    # def _get_users_role(self, user: dict):
    #     """ Helper method to return the role of the user """
    #     return user['role']
    #
    # def _get_users_by_role(self, role: Role):
    #     query = {"role": role.value}
    #
    #     return list(self.users_collection.find(query))
    #
    # def find_user_by_name(self, username: str) -> dict:
    #     """ Retrieve a user document by their username """
    #     return self.users_collection.find_one({"username": username})
    #
    # def find_username_by_id(self, user_id: str) -> str:
    #     user = self.users_collection.find_one({"_id": ObjectId(user_id)})
    #     return user['username']
