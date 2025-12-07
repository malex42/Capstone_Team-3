import sys
import os

# Add the parent folder of 'server' to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from handlers.password_handler import PasswordHandler
import pytest
from unittest.mock import MagicMock
import pymongo

from unittest.mock import MagicMock
from bson import ObjectId
from pymongo import errors
from handlers.business_handler import BusinessHandler
from handlers.exceptions.exceptions import BusinessAlreadyExistsError

from handlers.account_handler import AccountHandler
from handlers.db_handler import DatabaseHandler
from handlers.exceptions.exceptions import UserAlreadyExistsError, PasswordFormatError


# Helper function for creating mock database
def make_db_and_collection(has_business_collection=True):
    db = MagicMock()
    if has_business_collection:
        db.list_collection_names.return_value = ["Businesses", "Users"]
    else:
        db.list_collection_names.return_value = ["Users"]

    business_collection = MagicMock()
    users_collection = MagicMock()

    # Return different collections based on the key
    def getitem_side_effect(key):
        if key == "Users":
            return users_collection
        elif key == "Businesses":
            return business_collection
        else:
            return business_collection  # Default to business collection for backwards compatibility

    db.__getitem__.side_effect = getitem_side_effect
    db.create_collection = MagicMock(return_value=business_collection)

    # Return business_collection for backwards compatibility (renamed from 'collection')
    return db, business_collection, users_collection


# account_handler.py tests
def test_account_handler_initialization():
    # Mock the database
    db = MagicMock()
    db.list_collection_names.return_value = []
    collection = MagicMock()
    db.__getitem__.return_value = collection
    db.create_collection = MagicMock()

    # Properly mock the db_handler with a database attribute
    db_handler = MagicMock()
    db_handler.database = db  # explicitly set the attribute

    # Real or mocked password handler
    pw_handler = PasswordHandler()

    # Create AccountHandler
    handler = AccountHandler(db_handler, pw_handler)

    # Assertions
    assert handler is not None
    assert handler.pw_handler == pw_handler


def test_insert_user_employee():
    db, collection, users_collection = make_db_and_collection(has_business_collection=True)
    db_handler = MagicMock(database=db)
    pw_handler = MagicMock()

    handler = AccountHandler(db_handler, pw_handler)

    # Correct signature: name, input_username, hashed_password, role, code
    handler._insert_user(
        name="Test User",
        input_username="test_user",
        hashed_password="hashed_pass",
        role="employee",
        code=None
    )

    collection.insert_one.assert_called_once()
    inserted = collection.insert_one.call_args[0][0]
    assert inserted["name"] == "Test User"
    assert inserted["username"] == "test_user"
    assert inserted["password"] == "hashed_pass"
    assert inserted["role"] == "employee"


def test_insert_user_manager():
    db, collection, users_collection = make_db_and_collection(has_business_collection=True)
    db_handler = MagicMock(database=db)
    pw_handler = MagicMock()

    handler = AccountHandler(db_handler, pw_handler)

    # Correct signature with business code
    handler._insert_user(
        name="Manager One",
        input_username="manager1",
        hashed_password="hashed_pass",
        role="manager",
        code="BIZ123"
    )

    collection.insert_one.assert_called_once()
    inserted = collection.insert_one.call_args[0][0]
    assert inserted["name"] == "Manager One"
    assert inserted["username"] == "manager1"
    assert inserted["password"] == "hashed_pass"
    assert inserted["role"] == "manager"
    assert inserted["business_code"] == "BIZ123"


def test_insert_user_duplicate_error():
    db, collection, users_collection = make_db_and_collection(has_business_collection=True)
    db_handler = MagicMock(database=db)
    pw_handler = MagicMock()

    collection.insert_one.side_effect = pymongo.errors.DuplicateKeyError("dup")

    handler = AccountHandler(db_handler, pw_handler)

    with pytest.raises(pymongo.errors.DuplicateKeyError):
        handler._insert_user(
            name="Existing User",
            input_username="existing",
            hashed_password="hashed_pass",
            role="employee",
            code=None
        )


def test_create_user_success(monkeypatch):
    db, collection, users_collection = make_db_and_collection(has_business_collection=True)
    db_handler = MagicMock(database=db)
    pw_handler = MagicMock()

    # Mock password validation and hashing
    pw_handler.validate_password.return_value = True
    pw_handler.hash_password.return_value = "hashed_password"

    # Mock validation
    monkeypatch.setattr("handlers.validation_handler.ValidationHandler.validate_user_input", lambda x: True)

    handler = AccountHandler(db_handler, pw_handler)
    # Correct signature: first_name, last_name, input_username, input_password, role, code
    result = handler.create_user(
        first_name="Test",
        last_name="User",
        input_username="test_user",
        input_password="ValidPass1",
        role="employee",
        code=None
    )

    assert result is True
    collection.insert_one.assert_called_once()
    inserted = collection.insert_one.call_args[0][0]
    assert inserted["name"] == "Test User"
    assert inserted["username"] == "test_user"
    assert inserted["password"] == "hashed_password"
    assert inserted["role"] == "employee"
    assert "created_at" in inserted


def test_create_user_duplicate(monkeypatch):
    db, collection, users_collection = make_db_and_collection(has_business_collection=True)
    db_handler = MagicMock(database=db)
    pw_handler = MagicMock()

    pw_handler.validate_password.return_value = True
    collection.insert_one.side_effect = pymongo.errors.DuplicateKeyError("dup")

    monkeypatch.setattr("handlers.validation_handler.ValidationHandler.validate_user_input", lambda x: True)

    handler = AccountHandler(db_handler, pw_handler)
    with pytest.raises(UserAlreadyExistsError):
        handler.create_user(
            first_name="Existing",
            last_name="User",
            input_username="existing_user",
            input_password="ValidPass1",
            role="employee",
            code=None
        )


def test_validate_login_success():
    db, collection, users_collection = make_db_and_collection(has_business_collection=True)
    db_handler = MagicMock(database=db)
    pw_handler = MagicMock()

    # Mock user found in database
    collection.find_one.return_value = {
        "username": "testuser",
        "password": "hashed_password"
    }

    # Mock password verification
    pw_handler.verify_password_match.return_value = True

    handler = AccountHandler(db_handler, pw_handler)
    result = handler.validate_login("testuser", "ValidPass1")

    assert result is True
    pw_handler.verify_password_match.assert_called_once_with(
        password="ValidPass1",
        hashed_password="hashed_password"
    )


def test_validate_login_user_not_found():
    db, collection, users_collection = make_db_and_collection(has_business_collection=True)
    db_handler = MagicMock(database=db)
    pw_handler = MagicMock()

    # Mock user not found
    collection.find_one.return_value = None

    handler = AccountHandler(db_handler, pw_handler)
    result = handler.validate_login("nonexistent", "ValidPass1")

    assert result is False
    pw_handler.verify_password_match.assert_not_called()


# business_handler.py tests
def test_init_creates_collection_if_missing():
    db, collection, users_collection = make_db_and_collection(has_business_collection=False)
    db_handler = MagicMock(database=db)

    handler = BusinessHandler(db_handler)

    db.create_collection.assert_called_once_with("Businesses")
    assert handler.business_collection is collection
    assert collection.create_index.call_count >= 1


def test_create_business_success(monkeypatch):
    db, collection, users_collection = make_db_and_collection(has_business_collection=True)
    db_handler = MagicMock(database=db)

    monkeypatch.setattr("handlers.validation_handler.ValidationHandler.validate_user_input", lambda x: True)
    monkeypatch.setattr("handlers.business_handler.id_generator", lambda: "FIXEDCODE")

    # Mock the insert_one and find_one for business creation
    collection.insert_one = MagicMock()
    collection.find_one = MagicMock(return_value={"_id": ObjectId(), "code": "FIXEDCODE"})

    # Mock update_one for users collection (already returned from helper)
    users_collection.update_one = MagicMock()

    handler = BusinessHandler(db_handler)

    user_id = str(ObjectId())
    code = handler.create_business("My Biz", {"mon": "9-5"}, user_id)

    assert code == "FIXEDCODE"
    collection.insert_one.assert_called_once()
    inserted = collection.insert_one.call_args[0][0]
    assert inserted["business_name"] == "My Biz"
    assert inserted["code"] == "FIXEDCODE"
    assert inserted["created_by"] == user_id
    assert "created_dt" in inserted
    assert "schedules" in inserted


def test_create_business_duplicate_raises(monkeypatch):
    db, collection, users_collection = make_db_and_collection(has_business_collection=True)
    db_handler = MagicMock(database=db)

    monkeypatch.setattr("handlers.validation_handler.ValidationHandler.validate_user_input", lambda x: True)
    monkeypatch.setattr("handlers.business_handler.id_generator", lambda: "DUPCODE")

    collection.insert_one.side_effect = pymongo.errors.DuplicateKeyError("dup")

    handler = BusinessHandler(db_handler)
    with pytest.raises(BusinessAlreadyExistsError):
        handler.create_business("My Biz", {}, "user123")


def test_create_business_validation_fails(monkeypatch):
    db, collection, users_collection = make_db_and_collection(has_business_collection=True)
    db_handler = MagicMock(database=db)

    monkeypatch.setattr("handlers.validation_handler.ValidationHandler.validate_user_input", lambda x: False)

    handler = BusinessHandler(db_handler)
    result = handler.create_business("Bad<>Name", {}, "user123")

    assert result is None
    collection.insert_one.assert_not_called()


# password_handler.py tests
def test_validate_password():
    pw_handler = PasswordHandler()

    # Valid password
    assert pw_handler.validate_password("StrongPass1") is True

    # Too short
    with pytest.raises(ValueError):
        pw_handler.validate_password("Short1")

    # No uppercase letter
    with pytest.raises(ValueError):
        pw_handler.validate_password("nouppercase1")

    # No lowercase letter
    with pytest.raises(ValueError):
        pw_handler.validate_password("NOLOWERCASE1")

    # No number
    with pytest.raises(ValueError):
        pw_handler.validate_password("NoNumber")


def test_hash_and_verify_password():
    pw_handler = PasswordHandler()
    password = "ValidPass1"

    hashed = pw_handler.hash_password(password)
    assert hashed != password  # Ensure password is hashed

    # Verify correct password
    assert pw_handler.verify_password_match(password, hashed) is True

    # Verify incorrect password
    assert pw_handler.verify_password_match("WrongPass1", hashed) is False