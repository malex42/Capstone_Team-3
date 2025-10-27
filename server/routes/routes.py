from flask import g

from handlers.account_handler import AccountHandler
from handlers.business_handler import BusinessHandler

from routes.account_management import create_user_endpoint, login_endpoint, refresh_token_endpoint
from routes.business_management import create_business_endpoint, link_business_endpoint


def setup_routes(app, account_handler: AccountHandler, business_handler: BusinessHandler):
    """ Setup routes and bind to the app """

    @app.before_request
    def before_request():
        pass
        # Attach account_handler to the global 'g' object for easy access in routes
        g.account_handler = account_handler
        g.business_handler = business_handler

    app.add_url_rule('/api/auth/register', view_func=create_user_endpoint, methods=['POST'])
    app.add_url_rule('/api/auth/login', view_func=login_endpoint, methods=['POST'])
    app.add_url_rule('/api/manager/new/business', view_func=create_business_endpoint, methods=['POST'])
    app.add_url_rule('/api/link_business', view_func=link_business_endpoint, methods=['POST'])

'''FOR LATER REFERENCE - IGNORE'''
# def protectedEndpoint():
#         # Manually call jwt_required() to enforce the JWT authentication
#         jwt_required()  # This will ensure the request has a valid JWT