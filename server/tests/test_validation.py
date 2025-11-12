import pytest
from handlers.password_handler import PasswordHandler

class TestPasswordHandler:
    """Unit tests for the PasswordHandler class"""
    @pytest.fixture
    def password_handler(self):
        return PasswordHandler()

    def test_validate_password_success(self, password_handler):
        """Test valid passwords pass validation"""
        valid_passwords = [
                "Password1",
                "Test1234",
                "Apple123",
                "Banana123"
        ]
        for password in valid_passwords:
            assert password_handler.validate_password(password) is True