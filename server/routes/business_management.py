from flask import request, jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity, create_access_token, set_access_cookies
from werkzeug.routing import ValidationError

from handlers.enums.roles import Role
from handlers.exceptions.exceptions import BusinessAlreadyExistsError
from handlers.validation_handler import is_authorized


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
    if not data or 'name' not in data or 'hours' not in data:
        return jsonify({"message": "Business Name and Hours are required"}), 400

    business_name = data['name']
    hours = data['hours']
    user_id = claims.get('user_id')
    username = get_jwt_identity()


    try:
        biz_code = g.business_handler.create_business(business_name, hours, user_id)
        if biz_code is not None:
            # Create new JWT token
            access_token = create_access_token(identity=username, additional_claims={"role": claims["role"],
                                                                                     "code": biz_code,
                                                                                     "user_id": user_id})
            set_access_cookies(response=jsonify({"msg": "code linking successful"}), encoded_access_token=access_token)

            return jsonify({"message": "success", "code": biz_code, 'JWT': access_token}), 200

    except BusinessAlreadyExistsError as e:
        return jsonify({"message": e.message}), 400

    return jsonify({"message": "failure, unknown"}), 400


def get_all_employees_endpoint():
    """ Endpoint to get all employees """

    # Get the claims from the JWT token
    verify_jwt_in_request()
    # Get the claims from the JWT token
    claims = get_jwt()

    # Check if user is authorized
    auth_check = is_authorized(claims, [Role.MANAGER])
    if auth_check:
        return auth_check

    # Get business_code from claims
    business_code = claims.get('code')
    if not business_code:
        return jsonify({"message": "Business code not found in token"}), 400

    try:

        # Call the business handler to get all employees
        employees = g.business_handler.get_all_employees(business_code)

        return jsonify(employees), 200

    except Exception as e:
        return jsonify({"message": f"Error fetching employees: {str(e)}"}), 500



def link_business_endpoint():
    data = request.get_json()
    verify_jwt_in_request()
    claims = get_jwt()

    auth_check = is_authorized(claims, [Role.MANAGER, Role.EMPLOYEE])
    if auth_check:
        return auth_check

    if not data or 'code' not in data:
        return jsonify({"message": "Business code is required"}), 400

    business_code = data['code']
    username = get_jwt_identity()

    try:
        business_key = g.business_handler.insert_user(business_code, username)

        if not business_key:
            return jsonify({"message": "failure"}), 400

        if not g.business_handler.insert_user(code=business_code, username=username):
            return jsonify({"message": "Could not update business code"}), 400

        access_token = create_access_token(
            identity=username,
            additional_claims={
                "role": claims["role"],
                "code": business_code,
                "user_id": claims["user_id"]
            }
        )

        response = jsonify({"message": "success", "JWT": access_token})
        set_access_cookies(response=response, encoded_access_token=access_token)

        return response, 200

    except ValueError as e:
        return jsonify({"message": str(e)}), 404



