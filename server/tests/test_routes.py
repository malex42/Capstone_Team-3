import pytest
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


@pytest.fixture
def mock_handlers():
    """Create mock handlers"""
    account_handler = Mock(spec=AccountHandler)
    business_handler = Mock(spec=BusinessHandler)
    return account_handler, business_handler


def test_all_routes_registered(app, mock_handlers):
    """Test that all routes are registered"""
    account_handler, business_handler = mock_handlers
    setup_routes(app, account_handler, business_handler)

    routes = [rule.rule for rule in app.url_map.iter_rules()]

    assert '/api/auth/register' in routes
    assert '/api/auth/login' in routes
    assert '/api/manager/new/business' in routes
    assert '/api/link_business' in routes


def test_routes_use_post_method(app, mock_handlers):
    """Test that all routes accept POST method"""
    account_handler, business_handler = mock_handlers
    setup_routes(app, account_handler, business_handler)

    api_routes = [
        '/api/auth/register',
        '/api/auth/login',
        '/api/manager/new/business',
        '/api/link_business'
    ]

    for rule in app.url_map.iter_rules():
        if rule.rule in api_routes:
            assert 'POST' in rule.methods