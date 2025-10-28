from flask import request, jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity

from handlers.enums.roles import Role
from handlers.validation_handler import is_authorized


def new_schedule_endpoint():
    """ Endpoint to create a new schedule """
    data = request.get_json()

    # JWT check
    verify_jwt_in_request()

    # Get the claims from the JWT token
    claims = get_jwt()

    # Role enforcement check
    auth_check = is_authorized(claims, [Role.MANAGER])
    if auth_check:
        return auth_check

    if not data or 'year' not in data or 'month' not in data:
        return jsonify({"message": "Business code is required"}), 400

    business_code = claims['code']
    user_id = claims['user_id']

    year = data['year']
    month = data['month']

    if g.schedule_handler.new_schedule(year, month, business_code, user_id):

        return jsonify({"message": "success"}), 200

    else:
        return jsonify({"message": "failure"}), 400



