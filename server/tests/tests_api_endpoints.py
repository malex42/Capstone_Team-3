"""API Endpoint Tests for System-level Tests"""
import pytest
import json
from flask import Flask
from flask_jwt_extended import JWTManager

from handlers.account_handler import AccountHandler
from handlers.business_handler import BusinessHandler
from handlers.db_handler import DatabaseHandler
from handlers.schedule_handler import ScheduleHandler
from handlers.password_handler import PasswordHandler
from mongomock import MongoClient

class MockDatabaseHandler:
    def __init__(self):
        self.client = MongoClient()
        self.database = self.client['test_db']

@pytest.fixture
def app():
    """Flask application fixture"""
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'
    JWTManager(app)

    #Create handlers
    db_handler = MockDatabaseHandler()
    pw_handler = PasswordHandler()
    account_handler = AccountHandler(db_handler, pw_handler)
    business_handler = BusinessHandler(db_handler)
    schedule_handler = ScheduleHandler(db_handler)

    # Setting up routes
    from routes.routes import setup_routes
    setup_routes(app, account_handler, business_handler, schedule_handler)

    # Clean database
    account_handler.users_collection.delete_many({})

    return app

@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()

class TestLoginEndpoint:
    """Tests for Login Endpoint"""
    def test_login_success(self, client):
        """Test login success endpoint"""
        client.post('/api/auth/register', json={
            'username': 'test_user',
            'password': 'Password123',
            'role':'employee'
        })

        response = client.post('/api/auth/login', json={
            'username': 'test_user',
            'password': 'Password123'
        })
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Success'
        assert 'JWT' in data

    def test_login_wrong_password(self, client):
        """Test login with wrong password"""
        client.post('/api/auth/register', json={
            'username': 'test_user',
            'password': 'Password123',
            'role': 'employee'
        })

        response = client.post('/api/auth/login', json={
            'username': 'test_user',
            'password': 'WrongPassword456'
        })
        assert response.status_code == 401

    def test_login_user_not_exist(self, client):
        """Test login with user not exist"""
        response = client.post('/api/auth/login', json={
            'username': 'not_exist',
            'password': 'Password123'
        })
        assert response.status_code == 401

    def test_login_missing_username(self, client):
        """Test login with missing username"""
        response = client.post('/api/auth/login', json={'password': 'Password123'})
        assert response.status_code == 400

    def test_login_missing_password(self, client):
        """Test login with missing password"""
        response = client.post('/api/auth/login', json={
            'username': 'test_user'
        })

        assert response.status_code == 400

class TestProtectedEndpoint:
    """Tests for Protected Endpoint"""

    def test_home_requires_auth(self, client):
        """Test home requires auth"""
        response = client.get('/api/home')
        assert response.status_code == 401

    def test_create_business_requires_auth(self, client):
        """Test create business requires auth"""
        response = client.post('/api/manager/new/business', json={
            'name': 'Test Business',
            'hours': {}
        })

        assert response.status_code == 401