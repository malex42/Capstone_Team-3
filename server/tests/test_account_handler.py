"""Integration Tests for AccountHandler. Test user creation, login validation, and database operations"""
import pytest
import pymongo
from mongomock import MongoClient
from datetime import datetime

from handlers.account_handler import AccountHandler
from handlers.password_handler import PasswordHandler
from handlers.enums.roles import Role
from handlers.exceptions.exceptions import UserAlreadyExistsError, PasswordFormatError


class MockDatabaseHandler:
    def __init__(self):
        self.client = MongoClient()
        self.database = self.client['test_db']


@pytest.fixture
def account_handler():
    """Create a mock account handler"""
    db_handler = MockDatabaseHandler()
    pd_handler = PasswordHandler()
    handler = AccountHandler(db_handler, pd_handler)

    handler.users_collection.delete_many({})
    return handler

class TestAccountHandler:
    """Tests for AccountHandler"""

    def test_create_user_success(self, account_handler):
        """Test creating a user successfully"""
        result = account_handler.create_user(
            "test_user",
            "Password123",
            Role.EMPLOYEE.value,
            None
        )

        assert result is True


    @pytest.fixture
    def test_create_user_appears_in_database(self, account_handler):
        """Test creating a user appears in database"""
        account_handler.create_user("test_user", "Password123", Role.EMPLOYEE.value, None)

        user = account_handler.find_user_by_name("test_user")

        assert user is not None
        assert user['username'] == "test_user"

    def test_create_duplicate_user_fails(self, account_handler):
        """Test creating a duplicate user fails"""
        account_handler.create_user("test_user", "Password123", Role.EMPLOYEE.value, None)

        with pytest.raises(UserAlreadyExistsError):
            account_handler.create_user("test_user", "Password456", Role.EMPLOYEE.value, None)

    def test_create_user_weak_password_fails(self, account_handler):
        """Test creating a user fails with weak password"""
        with pytest.raises(PasswordFormatError):
            account_handler.create_user("test_user", "weak", Role.EMPLOYEE.value, None)

    def test_login_with_correct_password(self, account_handler):
        """Test login with correct password"""
        account_handler.create_user("test_user", "Password123", Role.EMPLOYEE.value, None)

        result = account_handler.validate_login("test_user", "Password123")

        assert result is True

    def test_login_with_wrong_password(self, account_handler):
        """Test login with wrong password"""
        account_handler.create_user("test_user", "Password123", Role.EMPLOYEE.value, None)

        result = account_handler.validate_login("test_user", "Password456")

        assert result is False

    def test_login_nonexistent_user(self, account_handler):
        """Test login with nonexistent user"""
        result = account_handler.validate_login("test_user", "Password123")

        assert result is False

    def test_get_user_role(self, account_handler):
        """Test getting user role"""
        account_handler.create_user("manager1", "Password123", Role.MANAGER.value, None)

        role = account_handler.get_user_role("manager1")

        assert role == Role.MANAGER.value