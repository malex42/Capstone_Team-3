from flask import request, jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity
from werkzeug.routing import ValidationError

from handlers.enums.roles import Role
from handlers.exceptions.exceptions import BusinessAlreadyExistsError
from handlers.validation_handler import ValidationHandler, is_authorized


def create_business_endpoint():
    """ Endpoint to create a new business """
    data = request.get_json()

    # JWT check
    verify_jwt_in_request()

    # Get the claims from the JWT token
    claims = get_jwt()

    # Role enforcement check
    auth_check = is_authorized(claims, [Role.MANAGER])
    if auth_check:
        return auth_check

    # Ensure the required fields exist
    if not data or 'business_name' not in data or 'hours' not in data:
        return jsonify({"message": "Business Name and Hours are required"}), 400

    business_name = data['business_name']
    hours = data['hours']
    user_id = claims.get('user_id')

    try:
        biz_code = g.business_handler.create_business(business_name, hours, user_id)
        if biz_code is not None:
            return jsonify({"message": "success", "business_code": biz_code}), 200

    except BusinessAlreadyExistsError as e:
        return jsonify({"message": e.message}), 400

    return jsonify({"message": "failure, unknown"}), 400


def link_business_endpoint():
    """ Endpoint to create a new business """
    data = request.get_json()

    # JWT check
    verify_jwt_in_request()

    # Get the claims from the JWT token
    claims = get_jwt()

    # Role enforcement check
    auth_check = is_authorized(claims, [Role.MANAGER])
    if auth_check:
        return auth_check

    if not data or 'code' not in data:
        return jsonify({"message": "Business code is required"}), 400

    business_code = data['code']
    username = get_jwt_identity()

    if not username:
        return jsonify({"message": "Invalid username"}), 401

    try:
        business_key = g.business_handler.insert_user(business_code, username)

        if business_key:
            return jsonify({"message": "success"}), 200
        else:
            return jsonify({"message": "failure"}), 400
    except ValidationError as e:
        return jsonify({"message": str(e)}), 404



