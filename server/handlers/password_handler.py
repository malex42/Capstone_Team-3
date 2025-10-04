import re
import bcrypt


class PasswordHandler:
    def __init__(self):
        # Generate a salt for bcrypt hashing
        self.salt = bcrypt.gensalt()

    def validate_password(self, password):
        """Checks if the password meets the security requirements."""
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", password):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", password):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"\d", password):
            raise ValueError("Password must contain at least one number.")
        return True

    def hash_password(self, password):
        """Hashes the password using bcrypt for secure storage."""
        return bcrypt.hashpw(password.encode(), self.salt).decode()

    def verify_password_match(self, password, hashed_password):
        """Verifies a password against the stored bcrypt hash."""
        return bcrypt.checkpw(password.encode(), hashed_password.encode())
