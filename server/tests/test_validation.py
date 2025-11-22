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

    def test_validate_password_no_numbers(self, password_handler):
        """Test that password with no numbers present"""
        with pytest.raises(ValueError, match="at least one number"):
            password_handler.validate_password("PasswordOnly")

    def test_hashed_password_returns_string(self, password_handler):
        """Test that hashed password returns string"""
        hashed = password_handler.hash_password("Password123")
        assert isinstance(hashed, str)
        assert len(hashed) > 0

    def test_hash_password_different_outputs(self, password_handler):
        """Test that same password hashed outputs different outputs"""

        password = "Password123"
        hash1 = password_handler.hash_password(password)
        hash2 = password_handler.hash_password(password)
        assert hash1 == hash2

    def test_hash_different_outputs(self, password_handler):
        """Test that different passwords hashed outputs different outputs"""
        hash1 = password_handler.hash_password("Password123")
        hash2 = password_handler.hash_password("DifferentPass456")
        assert hash1 != hash2
        
    def test_verify_password_match_failure(self, password_handler):
        """Test that password matches failure"""
        password = "Password123"
        wrong_password = "WrongPass456"
        hashed = password_handler.hash_password(password)
        assert password_handler.verify_password_match(wrong_password, hashed) is False

    def test_verify_password_match_success(self, password_handler):
        """Test that password matches success"""
        password = "Password123"
        hashed = password_handler.hash_password(password)
        assert password_handler.verify_password_match(password, hashed) is True

