from flask import request, jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt

from handlers.enums.roles import Role
from handlers.validation_handler import ValidationHandler, is_authorized


def create_business_endpoint():
    """ Endpoint to create a new business """
    data = request.get_json()

    # JWT and Role enforcement check
    verify_jwt_in_request()

    # Get the claims from the JWT token
    claims = get_jwt()

    auth_check = is_authorized(claims, [Role.MANAGER])
    if auth_check:
        return auth_check

    # Ensure the required fields exist
    if not data not in data or 'business_name' not in data or 'hours' not in data:
        return jsonify({"message": "Business Name and Hours are required"}), 400

    business_name = data['business_name']
    hours = data['hours']
    user_id = claims.get('user_id')

    biz_code = g.business_handler.create_business(business_name, hours, user_id)
    if biz_code is not None:
        return jsonify({"message": "success", "business_code": biz_code}), 200

    return jsonify({"message": "failure, unknown"}), 400



