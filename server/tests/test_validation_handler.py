"""Test input validation and sanitization"""
import pytest
from handlers.validation_handler import ValidationHandler

class TestValidationHandler:
    """Made unit tests for ValidationHandler"""

    def test_validate_valid_inputs(self):
        """Test that input validation works"""
        valid_inputs = [
            "test@example",
            "username"
        ]
        for input_text in valid_inputs:
            assert ValidationHandler.validate_user_input(input_text) is True
