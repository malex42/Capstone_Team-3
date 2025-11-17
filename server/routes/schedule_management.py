from flask import request, jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity

from handlers.enums.roles import Role
from handlers.validation_handler import is_authorized
from tools import jsonify_keys





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


def get_schedules_endpoint():
    """ Endpoint to get all schedules in a business """
    # JWT check
    verify_jwt_in_request()

    # Get the claims from the JWT token
    claims = get_jwt()

    # Role enforcement check
    auth_check = is_authorized(claims, [Role.MANAGER])
    if auth_check:
        return auth_check

    business_code = claims['code']

    try:
        schedules = g.schedule_handler.get_schedules(business_code)
        schedules = jsonify_keys(original=schedules, keys_to_convert=['_id'])
        return jsonify({"schedules": schedules, "message": "success"}), 200

    except Exception as e:
        msg = f"failure: {e}"
        return jsonify({"message": msg}), 400


def add_shift_endpoint():
    """ Endpoint to add a shift to a schedule """
    data = request.get_json()

    # JWT check
    verify_jwt_in_request()

    # Get the claims from the JWT token
    claims = get_jwt()

    # Role enforcement check
    auth_check = is_authorized(claims, [Role.MANAGER])
    if auth_check:
        return

    if not data or 'schedule_id' not in data or 'shift' not in data:
        return jsonify({"message": "Schedule ID and shift object are required"}), 400

    schedule_id = data['schedule_id']
    shift = data['shift']

    try:
        if g.schedule_handler.add_shift(schedule_id=schedule_id, shift=shift):
            return jsonify({"message": "success"}), 200

    except Exception as e:
        msg = f"failure: {e}"
        return jsonify({"message": msg}), 400

    return jsonify({"message": "failure"}), 400


def delete_shift_endpoint():
    """ Endpoint to add a shift to a schedule """
    data = request.get_json()

    # JWT check
    verify_jwt_in_request()

    # Get the claims from the JWT token
    claims = get_jwt()

    # Role enforcement check
    auth_check = is_authorized(claims, [Role.MANAGER])
    if auth_check:
        return

    if not data or 'schedule_id' not in data or 'shift_id' not in data:
        return jsonify({"message": "Schedule ID and Shift ID are required"}), 400

    schedule_id = data['schedule_id']
    shift_id = data['shift_id']

    try:
        if g.schedule_handler.delete_shift(schedule_id=schedule_id, shift_id=shift_id):
            return jsonify({"message": "success"}), 200

    except Exception as e:
        msg = f"failure: {e}"
        return jsonify({"message": msg}), 400

    return jsonify({"message": "failure"}), 400


def edit_shift_endpoint():
    """ Endpoint to add a shift to a schedule """
    data = request.get_json()

    # JWT check
    verify_jwt_in_request()

    # Get the claims from the JWT token
    claims = get_jwt()

    # Role enforcement check
    auth_check = is_authorized(claims, [Role.MANAGER])
    if auth_check:
        return

    if not data or 'schedule_id' not in data or 'shift' not in data:
        return jsonify({"message": "Schedule ID and shift object are required"}), 400

    schedule_id = data['schedule_id']
    shift = data['shift']

    try:
        if g.schedule_handler.edit_shift(schedule_id=schedule_id, shift=shift):
            return jsonify({"message": "success"}), 200

    except Exception as e:
        msg = f"failure: {e}"
        return jsonify({"message": msg}), 400

    return jsonify({"message": "failure"}), 400


def post_shift_endpoint():

    pass

    #TODO use g.schedule_handler.post_shift()
    data = request.get_json()

    # JWT check
    verify_jwt_in_request()

    # Get the claims from the JWT token
    claims = get_jwt()

    # Role enforcement check, only for managers that post shifts
    auth_check = is_authorized(claims, [Role.MANAGER])
    if auth_check:
        return auth_check

    if not data or 'shift_id' not in data:
        return jsonify({"message": "Shift id is required"}), 400

    try:
        posted_shifts = g.schedule_handler.get_posted_shifts(business_code)
        
def get_posted_shifts_endpoint():
    pass
    # TODO use g.schedule_handler.get_posted_shifts()

def take_shift_endpoint():
    pass
    # TODO use g.schedule_handler.take_shift()
    # get user_id from the JWT claims



