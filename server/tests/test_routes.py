import pytest
import json
from flask import Flask
from flask_jwt_extended import JWTManager
from unittest.mock import Mock, MagicMock, patch
from datetime import datetime, timedelta
from werkzeug.routing import ValidationError

