import sys
import os

# Add the parent folder of 'server' to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pytest
from flask import Flask
from flask_jwt_extended import JWTManager
from unittest.mock import Mock
from datetime import timedelta

from handlers.activity_handler import ActivityHandler
from handlers.schedule_handler import ScheduleHandler
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
    schedule_handler = Mock(spec=ScheduleHandler)
    activity_handler = Mock(spec=ActivityHandler)
    return account_handler, business_handler, schedule_handler, activity_handler


def test_all_routes_registered(app, mock_handlers):
    """Test that all routes are registered"""
    account_handler, business_handler, schedule_handler, activity_handler = mock_handlers
    setup_routes(app, account_handler, business_handler, schedule_handler, activity_handler)

    routes = [rule.rule for rule in app.url_map.iter_rules()]

    # Check main authentication routes
    assert '/api/auth/register' in routes
    assert '/api/auth/login' in routes

    # Check business routes
    assert '/api/business' in routes
    assert '/api/link_business' in routes

    # Check home route
    assert '/api/home' in routes

    # Check utility routes
    assert '/api/ping' in routes
    assert '/refresh' in routes


def test_routes_use_post_method(app, mock_handlers):
    """Test that POST routes accept POST method"""
    account_handler, business_handler, schedule_handler, activity_handler = mock_handlers
    setup_routes(app, account_handler, business_handler, schedule_handler, activity_handler)

    post_routes = [
        '/api/auth/register',
        '/api/auth/login',
        '/api/business',
        '/api/link_business',
        '/api/manager/schedules/new',
        '/api/manager/schedules/add_shift',
        '/api/manager/schedules/delete_shift',
        '/api/manager/schedules/edit_shift',
        '/api/employee/post_shift',
        '/api/employee/take_shift',
        '/api/employee/log_activity',
        '/refresh'
    ]

    for rule in app.url_map.iter_rules():
        if rule.rule in post_routes:
            assert 'POST' in rule.methods, f"Route {rule.rule} should accept POST method"


def test_routes_use_get_method(app, mock_handlers):
    """Test that GET routes accept GET method"""
    account_handler, business_handler, schedule_handler, activity_handler = mock_handlers
    setup_routes(app, account_handler, business_handler, schedule_handler, activity_handler)

    get_routes = [
        '/api/home',
        '/api/manager/schedules',
        '/api/manager/business/employees',
        '/api/employee/shifts',
        '/api/employee/next_shift',
        '/api/manager/activity',
        '/api/ping'
    ]

    for rule in app.url_map.iter_rules():
        if rule.rule in get_routes:
            assert 'GET' in rule.methods, f"Route {rule.rule} should accept GET method"


def test_setup_routes_accepts_four_handlers(app, mock_handlers):
    """Test that setup_routes accepts all 4 required handlers"""
    account_handler, business_handler, schedule_handler, activity_handler = mock_handlers

    # This should not raise any errors
    setup_routes(app, account_handler, business_handler, schedule_handler, activity_handler)

    # Verify routes were actually registered
    routes = [rule.rule for rule in app.url_map.iter_rules()]
