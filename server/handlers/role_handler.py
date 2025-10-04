from flask_jwt_extended import jwt_required, get_jwt, verify_jwt_in_request
from handlers.enums.roles import Role


class RoleValidationHandler:

    @classmethod
    def role_required(cls, required_role: [Role]):
        """
        Custom function to enforce role-based access control for routes.
        :param required_role: The role that is required for the route
        """

        # Ensure the user is authenticated
        verify_jwt_in_request()

        # Get the claims from the JWT token
        claims = get_jwt()

        is_role = False
        for role in required_role:
            if claims.get('role') == role.value:
                is_role = True

        # Check if the user has the required role
        if is_role is False:
            return {'msg': 'You do not have the required role to access this resource'}, 403
