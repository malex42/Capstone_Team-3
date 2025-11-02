from flask import request, jsonify, g
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt, \
    set_access_cookies
from handlers.exceptions.exceptions import PasswordFormatError, UserAlreadyExistsError
from handlers.enums.roles import Role
from handlers.role_handler import RoleValidationHandler
import jwt as pyjwt
from datetime import datetime


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
            user_id = g.account_handler.find_user_by_name(username)['_id']
            access_token = create_access_token(identity=username, additional_claims={"role": role, "code": code, "user_id": str(user_id)})
            set_access_cookies(response=jsonify({"msg": "login successful"}), encoded_access_token=access_token)

            # Decode token to read expiration
            decoded = pyjwt.decode(access_token, options={"verify_signature": False})
            exp_timestamp = decoded.get('exp')
            exp_time = datetime.fromtimestamp(exp_timestamp) if exp_timestamp else None

            return jsonify({
                "JWT": access_token,
                "message": "User created",
                "username": username,
                "expires_at": exp_time.strftime("%Y-%m-%d %H:%M:%S") if exp_time else None
            }), 200


    except (PasswordFormatError, UserAlreadyExistsError) as e:
        # Catch known errors
        return jsonify({"message": e.message}), 400

    # Default error response if something else goes wrong
    return jsonify({"message": "Failure. Unknown Error"}), 400



def login_endpoint():
    """ Endpoint to login a user """
    data = request.get_json()

    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"message": "Username and password are required"}), 400

    username = data['username']
    password = data['password']

    if g.account_handler.validate_login(username, password):
        user = g.account_handler.find_user_by_name(username)
        role = user['role']
        code = user.get('business_code', None)
        user_id = user['_id']

        # Create JWT token
        access_token = create_access_token(identity=username, additional_claims={"role": role, "code": code, "user_id": str(user_id)})
        set_access_cookies(response=jsonify({"msg": "login successful"}), encoded_access_token=access_token)

        # Decode token to read expiration
        decoded = pyjwt.decode(access_token, options={"verify_signature": False})
        exp_time = datetime.fromtimestamp(decoded.get('exp'))

        return jsonify({
            "JWT": access_token,
            "message": "Success",
            "username": username,
            "expires_at": exp_time.strftime("%Y-%m-%d %H:%M:%S") if exp_time else None
        }), 200

    return jsonify({"message": "Invalid username or password"}), 401


