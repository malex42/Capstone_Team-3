"""Integration Tests for AccountHandler. Test user creation, login validation, and database operations"""
import pytest
import pymongo
from mongomock import MongoClient
from datetime import datetime

from handlers.account_handler import AccountHandler
from handlers.password_handler import PasswordHandler
from handlers.enums.roles import Role
from handlers.exceptions.exceptions import UserAlreadyExistsError


class MockDatabaseHandler:
    def __init__(self):

