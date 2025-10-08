from flask import request, jsonify, g
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
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



def login_endpoint():
    """ Endpoint to login a user """
    data = request.get_json()

    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"message": "Username, password, and role are required"}), 400

    username = data['username']
    password = data['password']

    if g.account_handler.validate_login(username, password):
        role = g.account_handler.get_user_role(username)
        access_token = create_access_token(identity=username, additional_claims={"role": role})
        return jsonify({"JWT": access_token, "message": "Success", "username": username}), 200

    return jsonify({"message": "Failure. Unknown Error"}), 400




def expired_endpoint():
    """ Example of an expired endpoint that requires a valid JWT """

    current_user = get_jwt_identity()
    claims = get_jwt()

    return jsonify({
        "message": f"Hello {current_user}",
        "role": claims.get('role'),
        "code": claims.get('code')
    }), 200