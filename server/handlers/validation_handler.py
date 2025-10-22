import re
from handlers.enums.roles import Role
from flask_jwt_extended import verify_jwt_in_request, get_jwt


def is_authorized(claims, required_role: [Role]):
    """
    Custom function to enforce role-based access control for routes.
    :param claims: The JWT claims
    :param required_role: The role that is required for the route
    """

    is_role = False
    for role in required_role:
        if claims.get('role') == role.value:
            is_role = True

    # Check if the user has the required role
    if is_role is False:
        return {'msg': 'You do not have the required role to access this resource'}, 403


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
