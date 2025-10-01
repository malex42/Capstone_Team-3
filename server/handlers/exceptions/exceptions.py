class UserAlreadyExistsError(Exception):
    """Exception raised when the user already exists in the database."""
    def __init__(self, message="User already exists."):
        self.message = message
        super().__init__(self.message)


class PasswordFormatError(Exception):
    """Exception raised when the password format is invalid."""
    def __init__(self, message="Password does not meet the required format."):
        self.message = message
        super().__init__(self.message)