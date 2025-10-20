from datetime import timedelta, datetime, timezone
from flask import Flask, jsonify
from flask_jwt_extended import JWTManager, get_jwt, create_access_token, get_jwt_identity, set_access_cookies
from flask_cors import CORS

from configurations.config_manager import ConfigurationManager
from handlers.account_handler import AccountHandler
from handlers.db_handler import DatabaseHandler
from handlers.password_handler import PasswordHandler
from routes.routes import setup_routes


class Server:
    def __init__(self, config: ConfigurationManager):
        # Create instances of classes and the Flask app
        self.db_handler = DatabaseHandler(config.MONGO_URI)
        self.pw_handler = PasswordHandler()
        self.acct_handler = AccountHandler(db_handler=self.db_handler, pw_handler=self.pw_handler)

        self.app = Flask(__name__)

        # Enable CORS
        CORS(app=self.app)

        # Assign config variables
        self.app.config['JWT_SECRET_KEY'] = config.JWT_SECRET_KEY
        self.app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=15)
        self.host = config.SERVER_HOST
        self.port = config.SERVER_PORT

        # Initialize the JWTManager with the Flask app for token management
        jwt = JWTManager(self.app)

        @jwt.expired_token_loader
        def expired_token_callback(jwt_header, jwt_payload):  # noqa: ARG001
            return jsonify({
                "message": "Token has expired",
                "error": "token expired"
            }), 401

        @self.app.after_request
        def refresh_expiring_jwts(response):
            try:
                exp_timestamp = get_jwt()["exp"]
                now = datetime.now(timezone.utc)
                target_timestamp = datetime.timestamp(now + timedelta(minutes=5))
                if target_timestamp > exp_timestamp:
                    access_token = create_access_token(identity=get_jwt_identity())
                    set_access_cookies(response, access_token)
                return response
            except (RuntimeError, KeyError):
                # Case where there is not a valid JWT. Just return the original response
                return response

        @jwt.invalid_token_loader
        def invalid_token_callback(error):  # noqa: ARG001
            return jsonify({
                "message": "Invalid token",
                "error": "invalid token"
            }), 401

        @jwt.unauthorized_loader
        def missing_token_callback(error):  # noqa: ARG001
            return jsonify({
                "message": "Authorization token is missing",
                "error": "authorization is needed"
            }), 401

        # Set up all the API routes with the account handlers
        setup_routes(self.app, self.acct_handler)

    def run(self, debug: bool = False):
        # Start the Flask server with the specified host and port
        context = ('ssl/cert.pem', 'ssl/key.pem')  # certificate and key files
        self.app.run(host=self.host, port=self.port, debug=debug, ssl_context=context)