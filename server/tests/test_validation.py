import pytest
from handlers.password_handler import PasswordHandler

class TestPasswordHandler:

    def password_handler(self):
        return PasswordHandler()

    def test_validation_user_inputs(self, password_handler):

        user_inputs = [
                "",
                ""
        ]
