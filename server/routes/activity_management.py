from flask import request, jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt

from handlers.enums.roles import Role
from handlers.validation_handler import is_authorized


def upcoming_shift_endpoint():
    """ Endpoint to add a shift to a schedule """

    # JWT check
    verify_jwt_in_request()

    # Get the claims from the JWT token
    claims = get_jwt()

    # Role enforcement check
    auth_check = is_authorized(claims, [Role.EMPLOYEE])
    if auth_check:
        return auth_check

    user_id = claims["user_id"]
    business_code = claims["code"]

    try:
        shift = g.activity_handler.get_upcoming_shift(user_id=user_id, business_code=business_code)

        if shift:
            return jsonify({"message": "success", "shift": shift}), 200

        else:
            return jsonify({"message": "No Upcoming Shifts"}), 202

    except Exception as e:
        msg = f"failure: {e}"
        return jsonify({"message": msg}), 400


def log_activity_endpoint():

    data = request.get_json()

    # JWT check
    verify_jwt_in_request()

    # Get the claims from the JWT token
    claims = get_jwt()

    # Role enforcement check
    auth_check = is_authorized(claims, [Role.EMPLOYEE])
    if auth_check:
        return auth_check

    if not data or "shift_id" not in data or "clock_in" not in data:
        return jsonify({"message": "Missing Required Fields. shift_id and clock_in required."}), 400

    shift_id = data["shift_id"]
    clock_in = data["clock_in"]

    activity_phrase = "in" if clock_in else "out"

    try:
        success = g.activity_handler.log_activity(shift_id=shift_id, clock_in=clock_in)

        if success:
            return jsonify({"message": "success"}), 200

        else:
            return jsonify({"message": f"Could not clock {activity_phrase}. Ensure you are within 30 minutes of your scheduled shift."}), 401

    except Exception as e:
        msg = f"failure: {e}"
        return jsonify({"message": msg}), 400