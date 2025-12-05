"""API Endpoint Tests for System-level Tests"""
import pytest
import json
from flask import Flask
from flask_jwt_extended import JWTManager

from handlers.account_handler import AccountHandler
from handlers.business_handler import BusinessHandler
from handlers.schedule_handler import ScheduleHandler
from handlers.password_handler import PasswordHandler
from mongomock import MongoClient

class MockDatabaseHandler:
    def __init__(self):
        self.client = MongoClient()
        self.database = self.client['test_db']

    @pytest.fixture
    def app():