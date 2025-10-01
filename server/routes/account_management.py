from flask import request, jsonify, g
from flask_jwt_extended import create_access_token, jwt_required
from handlers.exceptions.exceptions import PasswordFormatError, UserAlreadyExistsError
from handlers.enums.roles import Role
from handlers.role_handler import RoleValidationHandler


def create_user_endpoint():
    """ Endpoint to create a new user """

    data = request.get_json()

    # Ensure the required fields exist
    if not data or 'username' not in data or 'password' not in data or 'role' not in data:
        return jsonify({"message": "Username, password, and role are required"}), 400

    username = data['username']
    password = data['password']
    role = data['role']

    if 'code' in data:
        code = data['code']
    else:
        code = None

    try:
        # Attempt to create the user and return success message
        if g.account_handler.create_user(username, password, role, code):
            access_token = create_access_token(identity=username, additional_claims={"role": role, "code": code})
            return jsonify({"JWT": access_token, "message": "Success", "username": username}), 200

    except (PasswordFormatError, UserAlreadyExistsError) as e:
        # Catch known errors
        return jsonify({"message": e.message}), 400

    # Default error response if something else goes wrong
    return jsonify({"message": "Failure. Unknown Error"}), 400
