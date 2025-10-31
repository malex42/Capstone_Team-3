import pytest
import json
from flask import Flask
from flask_jwt_extended import JWTManager
from unittest.mock import Mock
from datetime import timedelta

from routes.routes import setup_routes
from handlers.account_handler import AccountHandler
from handlers.business_handler import BusinessHandler


@pytest.fixture
def app():
    """Create a test Flask application"""
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'
    JWTManager(app)
    return app


