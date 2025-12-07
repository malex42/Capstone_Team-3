"""Unit Tests for Handler Classes"""
from handlers.password_handler import PasswordHandler
import pytest
from unittest.mock import MagicMock, patch
import pymongo

from bson import ObjectId
from pymongo import errors
from handlers.business_handler import BusinessHandler
from handlers.exceptions.exceptions import BusinessAlreadyExistsError

from handlers.account_handler import AccountHandler
from handlers.db_handler import DatabaseHandler
from handlers.exceptions.exceptions import UserAlreadyExistsError, PasswordFormatError


# Helper function for creating mock database
def make_db_and_collection(has_business_collection=True):
    """Create mock database and collections with proper setup"""
    db = MagicMock()

    # Set up collection names
    collections = ["Users"]
    if has_business_collection:
        collections.append("Businesses")
    db.list_collection_names.return_value = collections

    # Create mock collections
    business_collection = MagicMock()
    users_collection = MagicMock()

    # Return different collections based on the key
    def getitem_side_effect(key):
        if key == "Users":
            return users_collection
        elif key == "Businesses":
            return business_collection
        else:
            return MagicMock()

    db.__getitem__.side_effect = getitem_side_effect
    db.create_collection = MagicMock(return_value=business_collection)

    return db, business_collection, users_collection


# account_handler.py tests
def test_account_handler_initialization():
    """Test AccountHandler initialization"""
    db = MagicMock()
    db.list_collection_names.return_value = []
    collection = MagicMock()
    db.__getitem__.return_value = collection
    db.create_collection = MagicMock()

    db_handler = MagicMock()
    db_handler.database = db

    pw_handler = PasswordHandler()
    handler = AccountHandler(db_handler, pw_handler)

    assert handler is not None
    assert handler.pw_handler == pw_handler


def test_insert_user_employee():
    """Test inserting an employee user"""
    db, business_collection, users_collection = make_db_and_collection(has_business_collection=True)
    db_handler = MagicMock(database=db)
    pw_handler = MagicMock()

    handler = AccountHandler(db_handler, pw_handler)
    handler.users_collection = users_collection  # Explicitly set the collection

    handler._insert_user(
        name="Test User",
        input_username="test_user",
        hashed_password="hashed_pass",
        role="employee",
        code=None
    )

    # Verify insert_one was called
    assert users_collection.insert_one.called
    inserted = users_collection.insert_one.call_args[0][0]
    assert inserted["name"] == "Test User"
    assert inserted["username"] == "test_user"
    assert inserted["password"] == "hashed_pass"
    assert inserted["role"] == "employee"


def test_insert_user_manager():
    """Test inserting a manager user with business code"""
    db, business_collection, users_collection = make_db_and_collection(has_business_collection=True)
    db_handler = MagicMock(database=db)
    pw_handler = MagicMock()

    handler = AccountHandler(db_handler, pw_handler)
    handler.users_collection = users_collection

    handler._insert_user(
        name="Manager One",
        input_username="manager1",
        hashed_password="hashed_pass",
        role="manager",
        code="BIZ123"
    )

    assert users_collection.insert_one.called
    inserted = users_collection.insert_one.call_args[0][0]
    assert inserted["name"] == "Manager One"
    assert inserted["username"] == "manager1"
    assert inserted["password"] == "hashed_pass"
    assert inserted["role"] == "manager"
    assert inserted["business_code"] == "BIZ123"


def test_insert_user_duplicate_error():
    """Test that duplicate user insertion raises error"""
    db, business_collection, users_collection = make_db_and_collection(has_business_collection=True)
    db_handler = MagicMock(database=db)
    pw_handler = MagicMock()

    users_collection.insert_one.side_effect = pymongo.errors.DuplicateKeyError("dup")

    handler = AccountHandler(db_handler, pw_handler)
    handler.users_collection = users_collection

    with pytest.raises(pymongo.errors.DuplicateKeyError):
        handler._insert_user(
            name="Existing User",
            input_username="existing",
            hashed_password="hashed_pass",
            role="employee",
            code=None
        )


@patch("handlers.validation_handler.ValidationHandler.validate_user_input")
def test_create_user_success(mock_validate):
    """Test successful user creation"""
    mock_validate.return_value = True

    db, business_collection, users_collection = make_db_and_collection(has_business_collection=True)
    db_handler = MagicMock(database=db)
    pw_handler = MagicMock()

    pw_handler.validate_password.return_value = True
    pw_handler.hash_password.return_value = "hashed_password"

    handler = AccountHandler(db_handler, pw_handler)
    handler.users_collection = users_collection

    result = handler.create_user(
        first_name="Test",
        last_name="User",
        input_username="test_user",
        input_password="ValidPass1",
        role="employee",
        code=None
    )

    assert result is True
    assert users_collection.insert_one.called
    inserted = users_collection.insert_one.call_args[0][0]
    assert inserted["name"] == "Test User"
    assert inserted["username"] == "test_user"
    assert inserted["password"] == "hashed_password"
    assert inserted["role"] == "employee"
    assert "created_at" in inserted


@patch("handlers.validation_handler.ValidationHandler.validate_user_input")
def test_create_user_duplicate(mock_validate):
    """Test that creating duplicate user raises error"""
    mock_validate.return_value = True

    db, business_collection, users_collection = make_db_and_collection(has_business_collection=True)
    db_handler = MagicMock(database=db)
    pw_handler = MagicMock()

    pw_handler.validate_password.return_value = True
    users_collection.insert_one.side_effect = pymongo.errors.DuplicateKeyError("dup")

    handler = AccountHandler(db_handler, pw_handler)
    handler.users_collection = users_collection

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
    """Test successful login validation"""
    db, business_collection, users_collection = make_db_and_collection(has_business_collection=True)
    db_handler = MagicMock(database=db)
    pw_handler = MagicMock()

    users_collection.find_one.return_value = {
        "username": "testuser",
        "password": "hashed_password"
    }

    pw_handler.verify_password_match.return_value = True

    handler = AccountHandler(db_handler, pw_handler)
    handler.users_collection = users_collection

    result = handler.validate_login("testuser", "ValidPass1")

    assert result is True
    pw_handler.verify_password_match.assert_called_once_with(
        password="ValidPass1",
        hashed_password="hashed_password"
    )


def test_validate_login_user_not_found():
    """Test login validation when user doesn't exist"""
    db, business_collection, users_collection = make_db_and_collection(has_business_collection=True)
    db_handler = MagicMock(database=db)
    pw_handler = MagicMock()

    users_collection.find_one.return_value = None

    handler = AccountHandler(db_handler, pw_handler)
    handler.users_collection = users_collection

    result = handler.validate_login("nonexistent", "ValidPass1")

    assert result is False
    pw_handler.verify_password_match.assert_not_called()


# business_handler.py tests
def test_init_creates_collection_if_missing():
    """Test BusinessHandler creates collection if missing"""
    db, business_collection, users_collection = make_db_and_collection(has_business_collection=False)
    db_handler = MagicMock(database=db)

    handler = BusinessHandler(db_handler)

    db.create_collection.assert_called_once_with("Businesses")
    assert handler.business_collection is not None


@patch("handlers.validation_handler.ValidationHandler.validate_user_input")
@patch("handlers.business_handler.id_generator")
def test_create_business_success(mock_id_gen, mock_validate):
    """Test successful business creation"""
    mock_validate.return_value = True
    mock_id_gen.return_value = "FIXEDCODE"

    db, business_collection, users_collection = make_db_and_collection(has_business_collection=True)
    db_handler = MagicMock(database=db)

    business_collection.insert_one = MagicMock()
    business_collection.find_one = MagicMock(return_value={"_id": ObjectId(), "code": "FIXEDCODE"})
    business_collection.update_one = MagicMock()
    users_collection.update_one = MagicMock()

    handler = BusinessHandler(db_handler)
    handler.business_collection = business_collection
    handler.users_collection = users_collection

    user_id = str(ObjectId())
    code = handler.create_business("My Biz", {"mon": "9-5"}, user_id)

    assert code == "FIXEDCODE"
    assert business_collection.insert_one.called
    inserted = business_collection.insert_one.call_args[0][0]
    assert inserted["business_name"] == "My Biz"
    assert inserted["code"] == "FIXEDCODE"
    assert inserted["created_by"] == user_id
    assert "created_dt" in inserted


@patch("handlers.validation_handler.ValidationHandler.validate_user_input")
@patch("handlers.business_handler.id_generator")
def test_create_business_duplicate_raises(mock_id_gen, mock_validate):
    """Test that duplicate business raises error"""
    mock_validate.return_value = True
    mock_id_gen.return_value = "DUPCODE"

    db, business_collection, users_collection = make_db_and_collection(has_business_collection=True)
    db_handler = MagicMock(database=db)

    business_collection.insert_one.side_effect = pymongo.errors.DuplicateKeyError("dup")

    handler = BusinessHandler(db_handler)
    handler.business_collection = business_collection

    with pytest.raises(BusinessAlreadyExistsError):
        handler.create_business("My Biz", {}, "user123")


@patch("handlers.validation_handler.ValidationHandler.validate_user_input")
def test_create_business_validation_fails(mock_validate):
    """Test business creation fails with invalid input"""
    mock_validate.return_value = False

    db, business_collection, users_collection = make_db_and_collection(has_business_collection=True)
    db_handler = MagicMock(database=db)

    handler = BusinessHandler(db_handler)
    handler.business_collection = business_collection

    result = handler.create_business("Bad<>Name", {}, "user123")

    assert result is None
    business_collection.insert_one.assert_not_called()


# password_handler.py tests
def test_validate_password():
    """Test password validation rules"""
    pw_handler = PasswordHandler()

    # Valid password
    assert pw_handler.validate_password("StrongPass1") is True

    # Too short
    with pytest.raises(ValueError, match="at least 8 characters"):
        pw_handler.validate_password("Short1")

    # No uppercase letter
    with pytest.raises(ValueError, match="uppercase"):
        pw_handler.validate_password("nouppercase1")

    # No lowercase letter
    with pytest.raises(ValueError, match="lowercase"):
        pw_handler.validate_password("NOLOWERCASE1")

    # No number
    with pytest.raises(ValueError, match="number"):
        pw_handler.validate_password("NoNumber")


def test_hash_and_verify_password():
    """Test password hashing and verification"""
    pw_handler = PasswordHandler()
    password = "ValidPass1"

    hashed = pw_handler.hash_password(password)
    assert hashed != password  # Ensure password is hashed

    # Verify correct password
    assert pw_handler.verify_password_match(password, hashed) is True

    # Verify incorrect password
    assert pw_handler.verify_password_match("WrongPass1", hashed) is False