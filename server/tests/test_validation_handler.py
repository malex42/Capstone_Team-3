"""Test input validation and sanitization"""
import pytest
from handlers.validation_handler import ValidationHandler

class TestValidationHandler:
    """Made unit tests for ValidationHandler"""

    def test_validate_valid_inputs(self):
        """Test that input validation works"""
        valid_inputs = [
            "test@example",
            "username",
            "user-name",
            "user.name",
            "Coffee-Shop",
            "lead_developer",
            "project_manager",
            "business_owner"
        ]
        for input_text in valid_inputs:
            assert ValidationHandler.validate_user_input(input_text) is True

    def test_validate_input_length_limit(self):
        """Test that inputs exceed 50 characters would fail"""
        too_long = "a" * 51
        assert ValidationHandler.validate_user_input(too_long) is False

    def test_validate_input_length_boundary(self):
        """Test boundary of 50 characters"""
        approximate_50 = "a" * 50
        assert ValidationHandler.validate_user_input(approximate_50) is True

    def test_validate_input_sql_injection_attempt(self):
        """Test that sql injection attempt are blocked"""
        malicious_inputs = [
            "admin' OR '1'='1",
            "admin' AND 1=1--",
            "admin'||'1'='1",
            "' OR 1=1--",
            "1' OR '1'='1'--",
            "' OR 'x'='x",

        ]