from datetime import datetime

import jwt
from flask import g, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, set_access_cookies

from handlers.account_handler import AccountHandler
from handlers.activity_handler import ActivityHandler
from handlers.business_handler import BusinessHandler
from handlers.schedule_handler import ScheduleHandler

from routes.account_management import create_user_endpoint, login_endpoint
from routes.activity_management import upcoming_shift_endpoint, log_activity_endpoint
from routes.business_management import create_business_endpoint, link_business_endpoint
from routes.home_management import populate_home_endpoint
from routes.schedule_management import new_schedule_endpoint, get_schedules_endpoint, add_shift_endpoint, \
    delete_shift_endpoint, edit_shift_endpoint, get_posted_shifts_endpoint, take_shift_endpoint, post_shift_endpoint

from routes.business_management import get_all_employees_endpoint

def setup_routes(app, account_handler: AccountHandler, business_handler: BusinessHandler,
                 schedule_handler: ScheduleHandler, activity_handler: ActivityHandler):
    """ Setup routes and bind to the app """

    @app.before_request
    def before_request():
        # Attach account_handler to the global 'g' object for easy access in routes
        g.account_handler = account_handler
        g.business_handler = business_handler
        g.schedule_handler = schedule_handler
        g.activity_handler = activity_handler

    @app.route("/refresh", methods=["POST"])
    @jwt_required(refresh=True)
    def refresh():
        identity = get_jwt_identity()
        new_access_token = create_access_token(identity=identity)
        resp = jsonify({"msg": "token refreshed", "JWT": new_access_token})
        set_access_cookies(resp, new_access_token)
        return resp, 200

    app.add_url_rule('/api/auth/register', view_func=create_user_endpoint, methods=['POST'])
    app.add_url_rule('/api/auth/login', view_func=login_endpoint, methods=['POST'])

    app.add_url_rule('/api/manager/new/business', view_func=create_business_endpoint, methods=['POST'])
    app.add_url_rule('/api/link_business', view_func=link_business_endpoint, methods=['POST'])
    app.add_url_rule('/api/manager/business/employees', view_func=get_all_employees_endpoint, methods=['GET'])

    app.add_url_rule('/api/home', view_func=populate_home_endpoint, methods=['GET'])

    app.add_url_rule('/api/manager/schedules', view_func=get_schedules_endpoint, methods=['GET'])
    app.add_url_rule('/api/manager/schedules/new', view_func=new_schedule_endpoint, methods=['POST'])
    app.add_url_rule('/api/manager/schedules/add_shift', view_func=add_shift_endpoint, methods=['POST'])
    app.add_url_rule('/api/manager/schedules/delete_shift', view_func=delete_shift_endpoint, methods=['POST'])
    app.add_url_rule('/api/manager/schedules/edit_shift', view_func=edit_shift_endpoint, methods=['POST'])

    app.add_url_rule('/api/employee/shifts', view_func=get_posted_shifts_endpoint, methods=['GET'])
    app.add_url_rule('/api/employee/post_shift', view_func=post_shift_endpoint, methods=['POST'])
    app.add_url_rule('/api/employee/take_shift', view_func=take_shift_endpoint, methods=['POST'])

    app.add_url_rule('/api/employee/next_shift', view_func=upcoming_shift_endpoint, methods=['GET'])
    app.add_url_rule('/api/employee/log_activity', view_func=log_activity_endpoint, methods=['POST'])






'''FOR LATER REFERENCE - IGNORE'''
# def protectedEndpoint():
#         # Manually call jwt_required() to enforce the JWT authentication
#         jwt_required()  # This will ensure the request has a valid JWT