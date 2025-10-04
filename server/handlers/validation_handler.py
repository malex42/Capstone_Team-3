import re


class ValidationHandler:

    @classmethod
    def validate_user_input(cls, input_text: str) -> bool:
        """
        Validate the user input to prevent malicious input and ensure it meets the required criteria.
        """

        # Check for character limit (max 50 characters)
        if len(input_text) > 50:
            return False

        # Regular expression to disallow suspicious characters
        # This regex allows alphanumeric characters, underscores, hyphens, and periods.
        # It disallows ? / * and other suspicious characters.
        disallowed_characters_pattern = r'[<>;"\'%$&|\\^`~\?/\*\[\]\{\}\(\)]'

        if re.search(disallowed_characters_pattern, input_text):
            return False

        return True
