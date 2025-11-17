from datetime import datetime

from flask import request, jsonify, g
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt, \
    set_access_cookies, verify_jwt_in_request

from handlers.enums.roles import Role
from handlers.validation_handler import is_authorized


def populate_home_endpoint():
    # JWT check
    verify_jwt_in_request()

    # Get the claims from the JWT token
    claims = get_jwt()

    # Role enforcement check
    auth_check = is_authorized(claims, [Role.MANAGER, Role.EMPLOYEE])
    if auth_check:
        return auth_check

    # Extract the code from the claims
    code = claims['code']

    # Get the current month
    current_month = datetime.now().month

    if code and code != '':

        # Get the business from the db
        business = g.business_handler.get_business_from_code(code=code)

        if business:
            # Get the schedule for the business and current month
            schedule = g.schedule_handler.get_schedule_for_month(business_code=code, month=current_month)
            schedule_id = schedule['_id']

            return jsonify({
                "message": "success",
                "business_name": business["business_name"],
                "schedule_id": str(schedule_id),
                "shifts": schedule["shifts"] if schedule else ""
            }), 200
        else:
            return jsonify({"message": "failure: business does not exist"}), 400

    return jsonify({"message": "failure"}), 400