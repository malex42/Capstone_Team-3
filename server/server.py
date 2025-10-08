from datetime import timedelta
from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
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
        self.app.config['JWT_TOKEN_EXPIRATION'] = timedelta(seconds=30)
        self.host = config.SERVER_HOST
        self.port = config.SERVER_PORT

        # Initialize the JWTManager with the Flask app for token management
        jwt = JWTManager(self.app)

        @jwt.expired_token_loader
        def expired_token_callback(jwt_header, jwt_payload):  # noqa: ARG001
            return jsonify({
                "message": "Token has expired",
                "error": "token_expired"
            }), 401

        @jwt.invalid_token_loader
        def invalid_token_callback(error):  # noqa: ARG001
            return jsonify({
                "message": "Invalid token",
                "error": "invalid_token"
            }), 401

        @jwt.unauthorized_loader
        def missing_token_callback(error):  # noqa: ARG001
            return jsonify({
                "message": "Authorization token is missing",
                "error": "authorization_required"
            }), 401

        # Set up all the API routes with the account handlers
        setup_routes(self.app, self.acct_handler)

    def run(self, debug: bool = False):
        # Start the Flask server with the specified host and port
        self.app.run(host=self.host, port=self.port, debug=debug)