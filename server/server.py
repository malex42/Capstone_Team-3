from datetime import timedelta, datetime, timezone
from flask import Flask, jsonify
from flask_jwt_extended import JWTManager, get_jwt, create_access_token, get_jwt_identity, set_access_cookies
from flask_cors import CORS

from configurations.config_manager import ConfigurationManager
from handlers.account_handler import AccountHandler
from handlers.activity_handler import ActivityHandler
from handlers.business_handler import BusinessHandler
from handlers.db_handler import DatabaseHandler
from handlers.password_handler import PasswordHandler
from handlers.schedule_handler import ScheduleHandler
from routes.routes import setup_routes


class Server:
    def __init__(self, config: ConfigurationManager):
        # Create instances of classes and the Flask app
        self.db_handler = DatabaseHandler(config.MONGO_URI)
        self.pw_handler = PasswordHandler()
        self.acct_handler = AccountHandler(db_handler=self.db_handler, pw_handler=self.pw_handler)
        self.business_handler = BusinessHandler(db_handler=self.db_handler)
        self.schedule_handler = ScheduleHandler(db_handler=self.db_handler)
        self.activity_handler = ActivityHandler(db_handler=self.db_handler)

        self.app = Flask(__name__)

        # Initialize JWT
        jwt = JWTManager(self.app)

        # Enable CORS
        CORS(app=self.app)

        # Assign config variables
        self.app.config['JWT_SECRET_KEY'] = config.JWT_SECRET_KEY
        self.app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=15)
        self.app.config["JWT_TOKEN_LOCATION"] = ["headers"]
        self.app.config["JWT_HEADER_NAME"] = "Authorization"
        self.app.config["JWT_HEADER_TYPE"] = "Bearer"
        self.host = config.SERVER_HOST
        self.port = config.SERVER_PORT

        # Set up all the API routes with the account handlers
        setup_routes(self.app, self.acct_handler, self.business_handler, self.schedule_handler, self.activity_handler)

    def run(self, debug: bool = False):
        # Start the Flask server with the specified host and port
        context = ('ssl/cert.pem', 'ssl/key.pem')  # certificate and key files
        self.app.run(host=self.host, port=self.port, debug=debug, ssl_context=context)