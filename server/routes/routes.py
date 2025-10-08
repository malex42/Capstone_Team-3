from flask import g

from handlers.account_handler import AccountHandler
from routes.account_management import create_user_endpoint

from routes.account_management import login_endpoint
from routes.account_management import refresh_token_endpoint
from routes.account_management import expired_endpoint

def setup_routes(app, account_handler: AccountHandler):
    """ Setup routes and bind to the app """

    @app.before_request
    def before_request():
        pass
        # Attach account_handler to the global 'g' object for easy access in routes
        g.account_handler = account_handler

    app.add_url_rule('/auth/register', view_func=create_user_endpoint, methods=['POST'])
    app.add_url_rule('/auth/login', view_func=login_endpoint, methods=['POST'])
    app.add_url_rule('/auth/refresh', view_func=refresh_token_endpoint, methods=['POST'])
    app.add_url_rule('/auth/expired', view_func=expired_endpoint, methods=['POST'])



'''FOR LATER REFERENCE - IGNORE'''
# def protectedEndpoint():
#         # Manually call jwt_required() to enforce the JWT authentication
#         jwt_required()  # This will ensure the request has a valid JWT