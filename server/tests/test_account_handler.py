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
        self.client = MongoClient()
        self.database = self.client['test_db']

@pytest.fixture
def db_handler():
    """Create a mock database handler"""
    return MockDatabaseHandler()

@pytest.fixture
def password_handler():
    """Create a mock password handler"""
    return PasswordHandler()

@pytest.fixture
def account_handler(db_handler, password_handler):
    """Create a mock account handler"""
    db_handler = MockDatabaseHandler()
    pd_handler = PasswordHandler()
    handler = AccountHandler(db_handler, pd_handler)

    handler.users_collection.delete_many({})
    return handler


@pytest.fixture
def clean_db(account_handler):
    """Clean the database before and after each test"""
    account_handler.users_collection.delete_many({})
    yield
    account_handler.users_collection.delete_many({})
