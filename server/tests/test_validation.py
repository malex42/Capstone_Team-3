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

    def test_validate_password_too_short(self, password_handler):
        """Test password too short password validation"""
        with pytest.raises(ValueError, match="at least 8 characters long"):
            password_handler.validate_password("Pass1")

    def test_validate_password_no_uppercase(self, password_handler):
        """Test that passwords without uppercase letters fail"""
        with pytest.raises(ValueError, match="at least one uppercase letter"):
            password_handler.validate_password("password123")

    def test_validate_password_no_lowercase(self, password_handler):
        """Test that password with no lowercase letters present"""
        with pytest.raises(ValueError, match="at least one lowercase letter"):
            password_handler.validate_password("PASSWORD123")