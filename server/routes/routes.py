from datetime import datetime

import jwt
from flask import g, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token

from handlers.account_handler import AccountHandler
from handlers.business_handler import BusinessHandler
from handlers.schedule_handler import ScheduleHandler

from routes.account_management import create_user_endpoint, login_endpoint
from routes.business_management import create_business_endpoint, link_business_endpoint
from routes.home_management import populate_home_endpoint
from routes.schedule_management import new_schedule_endpoint, get_schedules_endpoint, add_shift_endpoint, \
    delete_shift_endpoint, edit_shift_endpoint


def setup_routes(app, account_handler: AccountHandler, business_handler: BusinessHandler,
                 schedule_handler: ScheduleHandler):
    """ Setup routes and bind to the app """

    @app.before_request
    def before_request():
        # Attach account_handler to the global 'g' object for easy access in routes
        g.account_handler = account_handler
        g.business_handler = business_handler
        g.schedule_handler = schedule_handler

        # @jwt_required(refresh=False)
        # def refresh_token_endpoint():
        #     username = get_jwt_identity()
        #     user = g.account_handler.find_user_by_name(username)
        #     role = user['role']
        #     user_id = user['_id']
        #     code = user.get('business_code', None)
        #
        #     new_access_token = create_access_token(identity=username, additional_claims={"role": role, "code": code,
        #                                                                                  "user_id": str(user_id)})
        #
        #     decoded = jwt.decode(new_access_token, options={"verify_signature": False})
        #     exp_time = datetime.fromtimestamp(decoded.get('exp'))
        #
        #     return jsonify({
        #         "access_token": new_access_token,
        #         "message": "Access token refreshed",
        #         "expires_at": exp_time.strftime("%Y-%m-%d %H:%M:%S")
        #     }), 200

    app.add_url_rule('/api/auth/register', view_func=create_user_endpoint, methods=['POST'])
    app.add_url_rule('/api/auth/login', view_func=login_endpoint, methods=['POST'])

    app.add_url_rule('/api/manager/new/business', view_func=create_business_endpoint, methods=['POST'])
    app.add_url_rule('/api/link_business', view_func=link_business_endpoint, methods=['POST'])

    app.add_url_rule('/api/home', view_func=populate_home_endpoint, methods=['GET'])

    app.add_url_rule('/api/manager/schedules', view_func=get_schedules_endpoint, methods=['GET'])
    app.add_url_rule('/api/manager/schedules/new', view_func=new_schedule_endpoint, methods=['POST'])
    app.add_url_rule('/api/manager/schedules/add_shift', view_func=add_shift_endpoint, methods=['POST'])
    app.add_url_rule('/api/manager/schedules/delete_shift', view_func=delete_shift_endpoint, methods=['POST'])
    app.add_url_rule('/api/manager/schedules/edit_shift', view_func=edit_shift_endpoint, methods=['POST'])


'''FOR LATER REFERENCE - IGNORE'''
# def protectedEndpoint():
#         # Manually call jwt_required() to enforce the JWT authentication
#         jwt_required()  # This will ensure the request has a valid JWT